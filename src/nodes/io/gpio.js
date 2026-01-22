// GPIO nodes - Runtime implementation
// Uses serialport-web for Web Serial API, firmata for protocol, johnny-five for robotics

/**
 * NodeBot config node - manages serial connection and Johnny-Five board
 * Serial port runs in main thread, Firmata protocol parsed here in worker
 */
export const nodebotRuntime = {
  type: 'nodebot',

  onInit() {
    this._boardReady = false;
    this._io = null;
    this._pins = {};
    this._components = {};
    this._inputSubscriptions = new Map();

    // We'll use mainThreadCall to handle serial port operations
    // since Web Serial API only works in main thread

    // Listen for serial data from main thread
    this.on('serial_data', (data) => {
      if (this._io && this._io.transport) {
        // Feed data to Firmata parser
        this._io.transport._receiveData(data);
      }
    });

    this.on('serial_open', () => {
      this.emit('networkReady');
      this._initFirmata();
    });

    this.on('serial_error', (err) => {
      this.emit('ioError', err);
      this.status({ fill: 'red', shape: 'dot', text: 'error' });
    });

    this.on('serial_close', () => {
      this._boardReady = false;
      this.emit('networkError');
      this.status({ fill: 'red', shape: 'ring', text: 'disconnected' });
    });

    // Auto-connect if we have a stored port
    if (this.config.autoConnect) {
      this._requestPort();
    }

    this.status({ fill: 'grey', shape: 'ring', text: 'not connected' });
  },

  async _requestPort() {
    this.status({ fill: 'yellow', shape: 'ring', text: 'requesting port...' });
    try {
      const result = await this.mainThreadCall('requestSerialPort', {
        baudRate: this.config.baudRate || 57600
      });
      if (result.success) {
        this.status({ fill: 'yellow', shape: 'dot', text: 'connecting...' });
      } else {
        this.status({ fill: 'red', shape: 'ring', text: result.error || 'failed' });
      }
    } catch (err) {
      this.status({ fill: 'red', shape: 'ring', text: err.message });
      this.emit('ioError', err);
    }
  },

  _initFirmata() {
    // Create a virtual transport that sends data via main thread
    const node = this;

    const transport = {
      _listeners: {},
      _receiveData(data) {
        // Called when data arrives from main thread
        const listeners = this._listeners['data'] || [];
        for (const cb of listeners) {
          cb(data);
        }
      },
      on(event, callback) {
        if (!this._listeners[event]) {
          this._listeners[event] = [];
        }
        this._listeners[event].push(callback);
        return this;
      },
      emit(event, ...args) {
        const listeners = this._listeners[event] || [];
        for (const cb of listeners) {
          cb(...args);
        }
      },
      write(data) {
        // Send data to main thread for serial transmission
        node.mainThread('serialWrite', { data: Array.from(data) });
      }
    };

    // Emit open event for Firmata
    setTimeout(() => transport.emit('open'), 0);

    // Dynamic import of firmata (must be available in worker bundle)
    import('firmata').then(({ Firmata }) => {
      this._io = new Firmata(transport);

      this._io.on('ready', () => {
        this._boardReady = true;
        this.emit('boardReady');
        this.status({ fill: 'green', shape: 'dot', text: 'connected' });

      });

      this._io.on('error', (err) => {
        this.emit('ioError', err);
        this.status({ fill: 'red', shape: 'dot', text: 'firmata error' });
      });
    }).catch(err => {
      this.error('Failed to load firmata:', err);
      this.status({ fill: 'red', shape: 'dot', text: 'firmata not available' });
    });
  },

  // Called by gpio-in nodes to subscribe to pin data
  subscribeInput(nodeId, pin, state, freq, callback) {
    if (!this._boardReady || !this._io) {
      return false;
    }

    const io = this._io;
    const pinNum = parseInt(pin, 10);
    const frequency = parseInt(freq, 10) || 250;

    try {
      if (state === 'ANALOG') {
        io.pinMode(pinNum, io.MODES.ANALOG);
        // Throttle analog reads to the specified frequency
        let lastEmit = 0;
        io.analogRead(pinNum, (value) => {
          const now = Date.now();
          if (now - lastEmit >= frequency) {
            lastEmit = now;
            callback(value);
          }
        });
      } else if (state === 'PULLUP') {
        io.pinMode(pinNum, io.MODES.PULLUP);
        io.digitalRead(pinNum, callback);
      } else {
        io.pinMode(pinNum, io.MODES.INPUT);
        io.digitalRead(pinNum, callback);
      }
      this._inputSubscriptions.set(nodeId, { pin: pinNum, state, callback });
      return true;
    } catch (e) {
      this.error('Error subscribing to pin:', e);
      return false;
    }
  },

  // Called by gpio-out nodes to write to pins
  writeOutput(pin, state, value) {
    if (!this._boardReady || !this._io) {
      return false;
    }

    const io = this._io;
    const pinNum = parseInt(pin, 10);

    try {
      if (state === 'OUTPUT') {
        io.pinMode(pinNum, io.MODES.OUTPUT);
        const digitalValue = (value === true || value === 1 || value === 'on' || value === 'ON') ? 1 : 0;
        io.digitalWrite(pinNum, digitalValue);
      } else if (state === 'PWM') {
        io.pinMode(pinNum, io.MODES.PWM);
        const pwmValue = Math.max(0, Math.min(255, parseInt(value, 10)));
        io.analogWrite(pinNum, pwmValue);
      } else if (state === 'SERVO') {
        io.pinMode(pinNum, io.MODES.SERVO);
        const servoValue = Math.max(0, Math.min(180, parseInt(value, 10)));
        io.servoWrite(pinNum, servoValue);
      }
      return true;
    } catch (e) {
      this.error('Error writing to pin:', e);
      return false;
    }
  },

  onClose() {
    if (this._io) {
      // Cleanup
      this._boardReady = false;
      this._inputSubscriptions.clear();
    }
    // Tell main thread to close serial port
    this.mainThread('closeSerialPort', {});
  }
};

/**
 * GPIO In node - reads digital/analog values from pins
 */
export const gpioInRuntime = {
  type: 'gpio in',

  onInit() {
    this._configNode = this._getNodebot();
    if (!this._configNode) return;

    this.status({ fill: 'yellow', shape: 'ring', text: 'initializing...' });

    this._configNode.on('networkReady', () => {
      this.status({ fill: 'yellow', shape: 'ring', text: 'connecting...' });
    });

    this._configNode.on('boardReady', () => {
      this.status({ fill: 'green', shape: 'dot', text: 'connected' });
      this._subscribe();
    });

    this._configNode.on('networkError', () => {
      this.status({ fill: 'red', shape: 'ring', text: 'disconnected' });
    });

    this._configNode.on('ioError', (err) => {
      this.status({ fill: 'red', shape: 'dot', text: err?.message || 'error' });
    });

    // If board is already ready, subscribe immediately
    if (this._configNode._boardReady) {
      this.status({ fill: 'green', shape: 'dot', text: 'connected' });
      this._subscribe();
    }
  },

  _getNodebot() {
    const configData = this.getConfigNode(this.config.board);
    if (!configData) {
      this.status({ fill: 'red', shape: 'ring', text: 'no nodebot' });
      return null;
    }
    return this.getNode(configData.id);
  },

  _subscribe() {
    if (!this._configNode) return;

    const pin = this.config.pin;
    const state = this.config.state || 'INPUT';
    const freq = this.config.freq || 250;

    const success = this._configNode.subscribeInput(this.id, pin, state, freq, (value) => {
      this.send({ payload: value, topic: pin });
    });

    if (success) {
      this.status({ fill: 'green', shape: 'dot', text: `pin ${pin}` });
    }
  }
};

/**
 * GPIO Out node - writes digital/analog/PWM/servo values to pins
 */
export const gpioOutRuntime = {
  type: 'gpio out',

  onInit() {
    this._configNode = this._getNodebot();
    if (!this._configNode) return;

    this.status({ fill: 'yellow', shape: 'ring', text: 'initializing...' });

    this._configNode.on('networkReady', () => {
      this.status({ fill: 'yellow', shape: 'ring', text: 'connecting...' });
    });

    this._configNode.on('boardReady', () => {
      this.status({ fill: 'green', shape: 'dot', text: 'connected' });
    });

    this._configNode.on('networkError', () => {
      this.status({ fill: 'red', shape: 'ring', text: 'disconnected' });
    });

    this._configNode.on('ioError', (err) => {
      this.status({ fill: 'red', shape: 'dot', text: err?.message || 'error' });
    });

    // If board is already ready
    if (this._configNode._boardReady) {
      this.status({ fill: 'green', shape: 'dot', text: 'connected' });
    }
  },

  _getNodebot() {
    const configData = this.getConfigNode(this.config.board);
    if (!configData) {
      this.status({ fill: 'red', shape: 'ring', text: 'no nodebot' });
      return null;
    }
    return this.getNode(configData.id);
  },

  onInput(msg) {
    if (!this._configNode || !this._configNode._boardReady) {
      return;
    }

    const pin = msg.pin || this.config.pin;
    const state = msg.state || this.config.state || 'OUTPUT';
    const value = msg.payload;

    this._configNode.writeOutput(pin, state, value);
  }
};

/**
 * Johnny5 script node - run custom Johnny-Five code
 */
export const johnny5Runtime = {
  type: 'johnny5',

  onInit() {
    this._configNode = this._getNodebot();
    if (!this._configNode) return;

    this.status({ fill: 'yellow', shape: 'ring', text: 'initializing...' });

    this._configNode.on('networkReady', () => {
      this.status({ fill: 'yellow', shape: 'ring', text: 'connecting...' });
    });

    this._configNode.on('boardReady', () => {
      this.status({ fill: 'green', shape: 'dot', text: 'connected' });
      this._runScript();
    });

    this._configNode.on('networkError', () => {
      this.status({ fill: 'red', shape: 'ring', text: 'disconnected' });
    });

    this._configNode.on('ioError', (err) => {
      this.status({ fill: 'red', shape: 'dot', text: err?.message || 'error' });
    });

    // If board is already ready
    if (this._configNode._boardReady) {
      this.status({ fill: 'green', shape: 'dot', text: 'connected' });
      this._runScript();
    }
  },

  _getNodebot() {
    const configData = this.getConfigNode(this.config.board);
    if (!configData) {
      this.status({ fill: 'red', shape: 'ring', text: 'no nodebot' });
      return null;
    }
    return this.getNode(configData.id);
  },

  async _runScript() {
    if (!this._configNode || !this.config.func) return;

    try {
      // Import johnny-five
      const five = await import('johnny-five');

      // Create a Board instance using the existing io
      const board = new five.Board({
        io: this._configNode._io,
        repl: false,
        debug: false
      });

      // Create sandbox context for the script
      const node = this;
      const context = {
        five,
        board,
        io: this._configNode._io,
        send: (msg) => node.send(msg),
        log: (text) => node.log(text),
        warn: (text) => node.warn(text),
        error: (text) => node.error(text),
        status: (s) => node.status(s),
        console,
        setTimeout,
        setInterval,
        clearTimeout,
        clearInterval
      };

      // The board is already ready (we're in boardReady handler)
      // so we can run the script immediately with a synthetic board.on('ready')

      // Create the function with context
      const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
      const scriptFn = new AsyncFunction(
        'five', 'board', 'io', 'send', 'log', 'warn', 'error', 'status',
        'console', 'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval',
        this.config.func
      );

      // Run the script
      await scriptFn(
        five, board, context.io, context.send, context.log, context.warn,
        context.error, context.status, console, setTimeout, setInterval,
        clearTimeout, clearInterval
      );

    } catch (err) {
      this.error('Script error: ' + err.message);
      this.status({ fill: 'red', shape: 'dot', text: 'script error' });
    }
  },

  onInput(msg) {
    // Store message for script to access
    this._lastMsg = msg;
    this.emit('input', msg);
  }
};
