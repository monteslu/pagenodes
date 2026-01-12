// Hsync nodes - Runtime implementation
// Delegates to main thread for WebRTC and HTTP server

export const hsyncConnectionRuntime = {
  type: 'hsync-connection',

  onInit() {
    const dynamic = this.config.dynamic !== false; // default true
    const hostname = this.config.hostname;
    const secret = this.config.secret;
    const dynamicHost = this.config.dynamicHost || 'https://demo.hsync.tech';
    const useLocalStorage = this.config.useLocalStorage !== false;
    const port = this.config.port || 3000;

    if (!dynamic && (!hostname || !secret)) {
      console.warn('hsync-connection: missing hostname or secret for manual mode');
      return;
    }

    this._connecting = true;
    this.emit('hsync_connecting');

    this.mainThread('connect', {
      dynamic,
      hostname,
      secret,
      dynamicHost,
      useLocalStorage,
      port
    });
  },

  onClose() {
    this.mainThread('disconnect', {});
  }
};

export const hsyncPeerRuntime = {
  type: 'hsync-peer'
  // Config node - no runtime behavior, just stores peer hostname
};

export const hsyncInRuntime = {
  type: 'hsync in',

  onInit() {
    const configNode = this._getHsyncConnection();
    if (!configNode) return;

    this._configNode = configNode;

    // Register this node with the connection for routing
    this.mainThread('register', {
      connectionId: this.config.connection,
      method: this.config.method || 'all',
      route: this.config.route || ''
    });

    configNode.on('hsync_connecting', () => {
      this.status({ fill: 'yellow', shape: 'ring', text: 'connecting' });
    });

    configNode.on('hsync_connected', (url) => {
      this.status({ fill: 'green', shape: 'dot', text: url || 'connected' });
    });

    configNode.on('hsync_disconnected', () => {
      this.status({ fill: 'red', shape: 'ring', text: 'disconnected' });
    });

    configNode.on('hsync_error', (err) => {
      this.status({ fill: 'red', shape: 'ring', text: err || 'error' });
    });
  },

  _getHsyncConnection() {
    const configData = this.getConfigNode(this.config.connection);
    if (!configData) {
      this.status({ fill: 'red', shape: 'ring', text: 'no connection' });
      return null;
    }
    return this.getNode(configData.id);
  },

  // HTTP requests come via sendResult from main thread
  // The message already has payload, _requestId, req (method, url, path, params, query, headers)
  onInput(msg) {
    // Pass through to output - the message is already formatted
    this.send(msg);
  },

  onClose() {
    // Unregister from connection
    this.mainThread('unregister', {
      connectionId: this.config.connection
    });
  }
};

export const hsyncOutRuntime = {
  type: 'hsync out',

  onInit() {
    const configNode = this._getHsyncConnection();
    if (!configNode) return;

    this._configNode = configNode;

    configNode.on('hsync_connected', (url) => {
      this.status({ fill: 'green', shape: 'dot', text: url || 'connected' });
    });

    configNode.on('hsync_disconnected', () => {
      this.status({ fill: 'red', shape: 'ring', text: 'disconnected' });
    });

    configNode.on('hsync_error', (err) => {
      this.status({ fill: 'red', shape: 'ring', text: err || 'error' });
    });
  },

  _getHsyncConnection() {
    const configData = this.getConfigNode(this.config.connection);
    if (!configData) {
      this.status({ fill: 'red', shape: 'ring', text: 'no connection' });
      return null;
    }
    return this.getNode(configData.id);
  },

  onInput(msg) {
    // Get requestId from message (set by hsync in)
    const requestId = msg._requestId;
    if (!requestId) {
      this.warn('No _requestId in message - cannot send response');
      return;
    }

    // Parse headers from config if present
    let headers = { 'Content-Type': 'application/json' };
    if (this.config.headers) {
      try {
        headers = JSON.parse(this.config.headers);
      } catch (e) {
        // Use defaults
      }
    }

    // Allow message to override headers
    if (msg.headers && typeof msg.headers === 'object') {
      headers = { ...headers, ...msg.headers };
    }

    // Get status code from config or message
    const statusCode = msg.statusCode || this.config.statusCode || 200;

    this.mainThread('respond', {
      configId: this.config.connection,
      requestId,
      statusCode,
      headers,
      payload: msg.payload
    });
  }
};

export const hsyncP2PInRuntime = {
  type: 'hsync p2p in',

  onInit() {
    const configNode = this._getHsyncConnection();
    const peerData = this.getConfigNode(this.config.peer);
    if (!configNode || !peerData) return;

    this._configNode = configNode;

    this.on('hsync_p2p_connected', () => {
      this.status({ fill: 'green', shape: 'dot', text: 'connected' });
    });

    this.on('hsync_p2p_disconnected', () => {
      this.status({ fill: 'red', shape: 'ring', text: 'disconnected' });
    });

    this.on('hsync_p2p_error', (err) => {
      this.status({ fill: 'red', shape: 'ring', text: err || 'error' });
    });

    this.mainThread('p2pConnect', {
      configId: this.config.connection,
      peerHostname: peerData.peerHostname,
      direction: 'in'
    });
  },

  _getHsyncConnection() {
    const configData = this.getConfigNode(this.config.connection);
    if (!configData) {
      this.status({ fill: 'red', shape: 'ring', text: 'no connection' });
      return null;
    }
    return this.getNode(configData.id);
  },

  onClose() {
    this.mainThread('p2pDisconnect', {});
  }
};

export const hsyncP2POutRuntime = {
  type: 'hsync p2p out',

  onInit() {
    const configNode = this._getHsyncConnection();
    const peerData = this.getConfigNode(this.config.peer);
    if (!configNode || !peerData) return;

    this._configNode = configNode;

    this.on('hsync_p2p_connected', () => {
      this.status({ fill: 'green', shape: 'dot', text: 'connected' });
    });

    this.on('hsync_p2p_disconnected', () => {
      this.status({ fill: 'red', shape: 'ring', text: 'disconnected' });
    });

    this.on('hsync_p2p_error', (err) => {
      this.status({ fill: 'red', shape: 'ring', text: err || 'error' });
    });

    this.mainThread('p2pConnect', {
      configId: this.config.connection,
      peerHostname: peerData.peerHostname,
      direction: 'out'
    });
  },

  _getHsyncConnection() {
    const configData = this.getConfigNode(this.config.connection);
    if (!configData) {
      this.status({ fill: 'red', shape: 'ring', text: 'no connection' });
      return null;
    }
    return this.getNode(configData.id);
  },

  onInput(msg) {
    this.mainThread('p2pSend', {
      payload: msg.payload
    });
  },

  onClose() {
    this.mainThread('p2pDisconnect', {});
  }
};
