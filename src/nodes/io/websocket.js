// WebSocket nodes - Runtime implementation

export const websocketClientRuntime = {
  type: 'websocket-client',

  onInit() {
    const url = this.config.url;
    if (!url) {
      console.warn('websocket-client: missing url');
      return;
    }

    this._connecting = true;
    this.emit('ws_connecting');

    try {
      const protocols = this.config.subprotocol ? [this.config.subprotocol] : undefined;
      this.ws = new WebSocket(url, protocols);

      this.ws.onopen = () => {
        this._connecting = false;
        this.emit('ws_connected', url);
      };

      this.ws.onclose = () => {
        this._connecting = false;
        this.emit('ws_disconnected');
      };

      this.ws.onerror = (err) => {
        this._connecting = false;
        this.emit('ws_error', err);
      };

      this.ws.onmessage = (event) => {
        this.emit('ws_message', event.data);
      };
    } catch (err) {
      this._connecting = false;
      console.error('websocket connection failed:', err);
      this.emit('ws_error', err);
    }
  },

  onClose() {
    if (this.ws) {
      this.ws.close();
    }
  }
};

export const websocketInRuntime = {
  type: 'websocket in',

  onInit() {
    const configNode = this._getWsConnection();
    if (!configNode) return;

    this._configNode = configNode;

    configNode.on('ws_connecting', () => {
      this.status({ fill: 'yellow', shape: 'ring', text: 'connecting' });
    });

    configNode.on('ws_connected', () => {
      this.status({ fill: 'green', shape: 'dot', text: 'connected' });
    });

    configNode.on('ws_disconnected', () => {
      this.status({ fill: 'red', shape: 'ring', text: 'disconnected' });
    });

    configNode.on('ws_error', () => {
      this.status({ fill: 'red', shape: 'ring', text: 'error' });
    });

    configNode.on('ws_message', (data) => {
      let payload = data;
      if (!this.config.wholemsg) {
        try { payload = JSON.parse(data); } catch { /* not JSON */ }
      }
      this.send({ payload });
    });

    // Set initial status
    if (configNode.ws && configNode.ws.readyState === WebSocket.OPEN) {
      this.status({ fill: 'green', shape: 'dot', text: 'connected' });
    } else if (configNode._connecting) {
      this.status({ fill: 'yellow', shape: 'ring', text: 'connecting' });
    }
  },

  _getWsConnection() {
    const configData = this.getConfigNode(this.config.client);
    if (!configData) {
      this.status({ fill: 'red', shape: 'ring', text: 'no connection' });
      return null;
    }
    return this.getNode(configData.id);
  }
};

export const websocketOutRuntime = {
  type: 'websocket out',

  onInit() {
    const configNode = this._getWsConnection();
    if (!configNode) return;

    this._configNode = configNode;
    this._queue = [];

    configNode.on('ws_connected', () => {
      this.status({ fill: 'green', shape: 'dot', text: 'connected' });
      // Send queued messages
      while (this._queue.length > 0 && this._configNode.ws?.readyState === WebSocket.OPEN) {
        this._configNode.ws.send(this._queue.shift());
      }
    });

    configNode.on('ws_disconnected', () => {
      this.status({ fill: 'red', shape: 'ring', text: 'disconnected' });
    });

    configNode.on('ws_error', () => {
      this.status({ fill: 'red', shape: 'ring', text: 'error' });
    });

    // Set initial status
    if (configNode.ws && configNode.ws.readyState === WebSocket.OPEN) {
      this.status({ fill: 'green', shape: 'dot', text: 'connected' });
    } else if (configNode._connecting) {
      this.status({ fill: 'yellow', shape: 'ring', text: 'connecting' });
    }
  },

  _getWsConnection() {
    const configData = this.getConfigNode(this.config.client);
    if (!configData) {
      this.status({ fill: 'red', shape: 'ring', text: 'no connection' });
      return null;
    }
    return this.getNode(configData.id);
  },

  onInput(msg) {
    const data = typeof msg.payload === 'string'
      ? msg.payload
      : JSON.stringify(msg.payload);

    if (this._configNode?.ws?.readyState === WebSocket.OPEN) {
      this._configNode.ws.send(data);
    } else {
      this._queue.push(data);
    }
  },

  onClose() {
    this._queue = [];
  }
};
