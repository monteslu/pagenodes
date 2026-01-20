// GPIO nodes - UI definitions

// Config node for NodeBot connection
export const nodebotNode = {
  type: 'nodebot',
  category: 'config',
  description: 'Johnny-Five board connection via Web Serial',
  label: (node) => node._node.name || 'nodebot',

  defaults: {
    name: { type: 'string', default: '' },
    boardType: {
      type: 'select',
      default: 'firmata',
      options: [
        { value: 'firmata', label: 'Firmata (Arduino)' }
      ],
      label: 'Board Type'
    },
    baudRate: {
      type: 'select',
      default: '57600',
      options: [
        { value: '9600', label: '9600' },
        { value: '57600', label: '57600' },
        { value: '115200', label: '115200' }
      ],
      label: 'Baud Rate'
    },
    autoConnect: {
      type: 'boolean',
      default: false,
      label: 'Auto-connect on deploy'
    }
  },

  // Main thread handlers for serial port operations
  // These run in the main browser thread (not worker) because Web Serial API requires it
  mainThread: {
    // Store serial ports by node ID
    _ports: {},

    async requestSerialPort(peer, nodeId, { baudRate }) {
      try {
        const { SerialPort, requestPort } = await import('serialport-web');

        // Request port from user (requires user gesture)
        const { port } = await requestPort();

        // Create and store the serial port
        const serialPort = new SerialPort({
          _port: port,
          baudRate: parseInt(baudRate, 10) || 57600
        });

        this._ports[nodeId] = serialPort;

        // Set up event handlers - emit events to worker
        serialPort.on('open', () => {
          peer.methods.emitEvent(nodeId, 'serial_open', {});
        });

        serialPort.on('data', (data) => {
          // Convert to array for transfer
          peer.methods.emitEvent(nodeId, 'serial_data', Array.from(data));
        });

        serialPort.on('error', (err) => {
          peer.methods.emitEvent(nodeId, 'serial_error', { message: err.message });
        });

        serialPort.on('close', () => {
          peer.methods.emitEvent(nodeId, 'serial_close', {});
          delete this._ports[nodeId];
        });

        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    },

    serialWrite(peer, nodeId, { data }) {
      const serialPort = this._ports[nodeId];
      if (serialPort && serialPort.isOpen) {
        serialPort.write(new Uint8Array(data));
      }
    },

    closeSerialPort(peer, nodeId) {
      const serialPort = this._ports[nodeId];
      if (serialPort) {
        serialPort.close();
        delete this._ports[nodeId];
      }
    }
  },

  renderHelp() {
    return (
      <>
        <p>Configuration node for Johnny-Five robotics boards using Web Serial API.</p>

        <h5>Requirements</h5>
        <ul>
          <li>Chrome, Edge, or Opera browser</li>
          <li>HTTPS or localhost</li>
          <li>Arduino with StandardFirmata firmware</li>
        </ul>

        <h5>Configuration</h5>
        <ul>
          <li><strong>Board Type</strong> - Currently supports Firmata (Arduino)</li>
          <li><strong>Baud Rate</strong> - Serial baud rate (57600 for most Arduinos)</li>
        </ul>

        <h5>Setup</h5>
        <ol>
          <li>Upload StandardFirmataPlus to your Arduino</li>
          <li>Connect Arduino via USB</li>
          <li>Deploy the flow - browser will prompt for port selection</li>
        </ol>
      </>
    );
  }
};

// GPIO In node
export const gpioInNode = {
  type: 'gpio in',
  category: 'hardware',
  description: 'Read digital or analog values from GPIO pins',
  label: (node) => {
    const pin = node._node.pin || node.pin;
    const state = node._node.state || node.state || 'INPUT';
    return node._node.name || `pin ${pin} (${state})`;
  },
  color: '#F3DF49',
  icon: true,
  faChar: '\uf2db', // microchip
  inputs: 0,
  outputs: 1,

  defaults: {
    name: { type: 'string', default: '' },
    board: { type: 'nodebot', default: '', label: 'Board', required: true },
    pin: { type: 'string', default: '0', label: 'Pin', required: true },
    state: {
      type: 'select',
      default: 'INPUT',
      options: [
        { value: 'INPUT', label: 'Digital Input' },
        { value: 'PULLUP', label: 'Digital Input (Pullup)' },
        { value: 'ANALOG', label: 'Analog Input' }
      ],
      label: 'Mode'
    },
    freq: {
      type: 'number',
      default: 250,
      label: 'Frequency (ms)',
      placeholder: '250'
    }
  },

  messageInterface: {
    writes: {
      payload: {
        type: 'number',
        description: 'Pin value (0/1 for digital, 0-1023 for analog)'
      },
      topic: {
        type: 'string',
        description: 'Pin number'
      }
    }
  },

  renderHelp() {
    return (
      <>
        <p>Reads values from GPIO pins on a Johnny-Five board.</p>

        <h5>Configuration</h5>
        <ul>
          <li><strong>Board</strong> - Select a NodeBot config</li>
          <li><strong>Pin</strong> - Pin number (0-13 for digital, A0-A5 for analog)</li>
          <li><strong>Mode</strong> - Input mode</li>
          <li><strong>Frequency</strong> - How often to emit values for analog inputs (ms)</li>
        </ul>

        <h5>Modes</h5>
        <ul>
          <li><strong>Digital Input</strong> - Reads HIGH (1) or LOW (0)</li>
          <li><strong>Digital Input (Pullup)</strong> - Uses internal pullup resistor</li>
          <li><strong>Analog Input</strong> - Reads 0-1023 (10-bit ADC)</li>
        </ul>

        <h5>Output</h5>
        <ul>
          <li><code>msg.payload</code> - Pin value</li>
          <li><code>msg.topic</code> - Pin number</li>
        </ul>
      </>
    );
  }
};

// GPIO Out node
export const gpioOutNode = {
  type: 'gpio out',
  category: 'hardware',
  description: 'Write digital, PWM, or servo values to GPIO pins',
  label: (node) => {
    const pin = node._node.pin || node.pin;
    const state = node._node.state || node.state || 'OUTPUT';
    return node._node.name || `pin ${pin} (${state})`;
  },
  color: '#F3DF49',
  icon: true,
  faChar: '\uf2db', // microchip
  inputs: 1,
  outputs: 0,

  defaults: {
    name: { type: 'string', default: '' },
    board: { type: 'nodebot', default: '', label: 'Board', required: true },
    pin: { type: 'string', default: '13', label: 'Pin', required: true },
    state: {
      type: 'select',
      default: 'OUTPUT',
      options: [
        { value: 'OUTPUT', label: 'Digital Output' },
        { value: 'PWM', label: 'PWM Output' },
        { value: 'SERVO', label: 'Servo' }
      ],
      label: 'Mode'
    }
  },

  messageInterface: {
    reads: {
      payload: {
        type: 'any',
        description: 'Value to write (0/1, 0-255, 0-180 depending on mode)',
        required: true
      },
      pin: {
        type: 'string',
        description: 'Override pin number',
        optional: true
      },
      state: {
        type: 'string',
        description: 'Override mode (OUTPUT, PWM, SERVO)',
        optional: true
      }
    }
  },

  renderHelp() {
    return (
      <>
        <p>Writes values to GPIO pins on a Johnny-Five board.</p>

        <h5>Configuration</h5>
        <ul>
          <li><strong>Board</strong> - Select a NodeBot config</li>
          <li><strong>Pin</strong> - Pin number</li>
          <li><strong>Mode</strong> - Output mode</li>
        </ul>

        <h5>Modes</h5>
        <ul>
          <li><strong>Digital Output</strong> - HIGH (1/true/on) or LOW (0/false/off)</li>
          <li><strong>PWM Output</strong> - 0-255 for brightness/speed control</li>
          <li><strong>Servo</strong> - 0-180 degrees</li>
        </ul>

        <h5>Input</h5>
        <ul>
          <li><code>msg.payload</code> - Value to write</li>
          <li><code>msg.pin</code> - Override pin (optional)</li>
          <li><code>msg.state</code> - Override mode (optional)</li>
        </ul>
      </>
    );
  }
};

// Johnny5 script node
export const johnny5Node = {
  type: 'johnny5',
  category: 'hardware',
  description: 'Run custom Johnny-Five code',
  label: (node) => node._node.name || 'johnny5',
  color: '#F3DF49',
  icon: true,
  faChar: '\uf544', // robot
  inputs: 1,
  outputs: 1,

  defaults: {
    name: { type: 'string', default: '' },
    board: { type: 'nodebot', default: '', label: 'Board', required: true },
    func: {
      type: 'code',
      default: `// Johnny-Five is available as 'five'
// Board IO is available as 'io'
// Use send(msg) to output messages

const led = new five.Led(13);
led.blink(500);

// Example: respond to input messages
// node.on('input', (msg) => {
//   led.brightness(msg.payload);
// });
`,
      label: 'Script',
      language: 'javascript'
    }
  },

  messageInterface: {
    reads: {
      payload: {
        type: 'any',
        description: 'Input data available to script'
      }
    },
    writes: {
      payload: {
        type: 'any',
        description: 'Output from send() calls in script'
      }
    }
  },

  renderHelp() {
    return (
      <>
        <p>Run custom Johnny-Five robotics code.</p>

        <h5>Available in Script</h5>
        <ul>
          <li><code>five</code> - Johnny-Five library</li>
          <li><code>board</code> - Board instance</li>
          <li><code>io</code> - Firmata IO instance</li>
          <li><code>send(msg)</code> - Send output message</li>
          <li><code>log(text)</code> - Log info message</li>
          <li><code>status(obj)</code> - Set node status</li>
        </ul>

        <h5>Example: Blink LED</h5>
        <pre>{`const led = new five.Led(13);
led.blink(500);`}</pre>

        <h5>Example: Servo Control</h5>
        <pre>{`const servo = new five.Servo(9);
servo.sweep();`}</pre>

        <h5>Example: Read Sensor</h5>
        <pre>{`const sensor = new five.Sensor('A0');
sensor.on('change', () => {
  send({ payload: sensor.value });
});`}</pre>
      </>
    );
  }
};
