// Socket.IO nodes - Runtime implementation
// Note: socket.io-client is imported by the worker

export const socketioClientRuntime = {
  type: 'socketio-client',

  onInit() {
    const server = this.config.server;
    if (!server) {
      console.warn('socketio-client: missing server url');
      return;
    }

    this._connecting = true;
    this.emit('sio_connecting');

    try {
      const options = {
        path: this.config.path || '/socket.io',
        transports: ['websocket', 'polling']
      };

      // io is available globally in worker
      this.socket = self.io(server, options);

      this.socket.on('connect', () => {
        this._connecting = false;
        this.emit('sio_connected', server);
      });

      this.socket.on('disconnect', () => {
        this._connecting = false;
        this.emit('sio_disconnected');
      });

      this.socket.on('connect_error', (err) => {
        this._connecting = false;
        this.emit('sio_error', err);
      });

      // Listen on configured event
      const eventName = this.config.event || 'message';
      this.socket.on(eventName, (data) => {
        this.emit('sio_message', data);
      });
    } catch (err) {
      this._connecting = false;
      console.error('socketio connection failed:', err);
      this.emit('sio_error', err);
    }
  },

  sendMessage(event, data) {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data);
    }
  },

  onClose() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
};

export const socketioInRuntime = {
  type: 'socketio in',

  onInit() {
    const configNode = this._getSocketioConnection();
    if (!configNode) return;

    this._configNode = configNode;

    configNode.on('sio_connecting', () => {
      this.status({ fill: 'yellow', shape: 'ring', text: 'connecting' });
    });

    configNode.on('sio_connected', () => {
      this.status({ fill: 'green', shape: 'dot', text: 'connected' });
    });

    configNode.on('sio_disconnected', () => {
      this.status({ fill: 'red', shape: 'ring', text: 'disconnected' });
    });

    configNode.on('sio_error', () => {
      this.status({ fill: 'red', shape: 'ring', text: 'error' });
    });

    configNode.on('sio_message', (data) => {
      this.send({ payload: data });
    });

    // Set initial status
    if (configNode.socket?.connected) {
      this.status({ fill: 'green', shape: 'dot', text: 'connected' });
    } else if (configNode._connecting) {
      this.status({ fill: 'yellow', shape: 'ring', text: 'connecting' });
    }
  },

  _getSocketioConnection() {
    const configData = this.getConfigNode(this.config.client);
    if (!configData) {
      this.status({ fill: 'red', shape: 'ring', text: 'no connection' });
      return null;
    }
    return this.getNode(configData.id);
  }
};

export const socketioOutRuntime = {
  type: 'socketio out',

  onInit() {
    const configNode = this._getSocketioConnection();
    if (!configNode) return;

    this._configNode = configNode;

    configNode.on('sio_connected', () => {
      this.status({ fill: 'green', shape: 'dot', text: 'connected' });
    });

    configNode.on('sio_disconnected', () => {
      this.status({ fill: 'red', shape: 'ring', text: 'disconnected' });
    });

    configNode.on('sio_error', () => {
      this.status({ fill: 'red', shape: 'ring', text: 'error' });
    });

    // Set initial status
    if (configNode.socket?.connected) {
      this.status({ fill: 'green', shape: 'dot', text: 'connected' });
    } else if (configNode._connecting) {
      this.status({ fill: 'yellow', shape: 'ring', text: 'connecting' });
    }
  },

  _getSocketioConnection() {
    const configData = this.getConfigNode(this.config.client);
    if (!configData) {
      this.status({ fill: 'red', shape: 'ring', text: 'no connection' });
      return null;
    }
    return this.getNode(configData.id);
  },

  onInput(msg) {
    if (!this._configNode) return;

    const event = msg.event || this.config.event || 'message';
    this._configNode.sendMessage(event, msg.payload);
  }
};
