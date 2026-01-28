// HTTP In node - Runtime implementation (server mode only)

export const httpInRuntime = {
  type: 'http in',

  onInit() {
    const url = this.config.url;
    const method = this.config.method || 'GET';

    if (!url) {
      this.error('No URL path configured');
      return;
    }

    if (!url.startsWith('/')) {
      this.error('URL must start with /');
      return;
    }

    if (typeof globalThis.isReservedPath === 'function' && globalThis.isReservedPath(url)) {
      this.error(`Path "${url}" is reserved and cannot be used`);
      return;
    }

    try {
      const node = this;
      this._routeKey = globalThis.addUserRoute(method, url, async (request, reply) => {
        const msg = {
          payload: request.body != null ? request.body : request.query || {},
          params: request.params || {},
          query: request.query || {},
          reqHeaders: request.headers,
          method: request.method,
          url: request.url,
          _res: reply
        };
        node.send(msg);
      });

      this.status({ fill: 'green', shape: 'dot', text: `${method} ${url}` });
    } catch (err) {
      this.error(err.message);
    }
  },

  onClose() {
    if (this._routeKey && typeof globalThis.removeUserRoute === 'function') {
      globalThis.removeUserRoute(this._routeKey);
      this._routeKey = null;
    }
  }
};

// HTTP Response node - Runtime implementation (server mode only)

export const httpResponseRuntime = {
  type: 'http response',

  onInput(msg) {
    const reply = msg._res;

    if (!reply) {
      this.error('No response object found on msg._res. Wire this node to an http-in node.');
      return;
    }

    if (reply.sent) {
      this.warn('Response already sent for this request');
      return;
    }

    const statusCode = msg.statusCode || this.config.statusCode || 200;

    // Merge configured headers with msg headers
    let headers = {};
    if (this.config.headers) {
      try {
        headers = JSON.parse(this.config.headers);
      } catch {
        // ignore invalid JSON in config
      }
    }
    if (msg.resHeaders && typeof msg.resHeaders === 'object') {
      headers = { ...headers, ...msg.resHeaders };
    }

    try {
      // Set headers
      for (const [key, value] of Object.entries(headers)) {
        reply.header(key, value);
      }

      reply.code(statusCode).send(msg.payload !== undefined ? msg.payload : '');
    } catch (err) {
      this.error(`Failed to send response: ${err.message}`);
    }
  }
};
