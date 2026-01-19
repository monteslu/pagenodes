// HTTP Request node - Runtime implementation

export const httpRequestRuntime = {
  type: 'http request',

  async onInput(msg) {
    const method = msg.method || this.config.method || 'GET';
    let url = msg.url || this.config.url;

    if (!url) {
      this.error('No URL specified');
      return;
    }

    // Simple mustache replacement for URL
    url = url.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
      const parts = key.trim().split('.');
      let value = msg;
      for (const part of parts) {
        value = value?.[part];
      }
      return value !== undefined ? encodeURIComponent(String(value)) : '';
    });

    try {
      const options = {
        method,
        headers: msg.headers || {}
      };

      if (method !== 'GET' && method !== 'HEAD' && msg.payload) {
        if (typeof msg.payload === 'object') {
          options.body = JSON.stringify(msg.payload);
          options.headers['Content-Type'] = 'application/json';
        } else {
          options.body = String(msg.payload);
        }
      }

      const response = await fetch(url, options);

      const ret = this.config.ret || 'txt';
      if (ret === 'obj') {
        msg.payload = await response.json();
      } else if (ret === 'bin') {
        msg.payload = await response.arrayBuffer();
      } else {
        msg.payload = await response.text();
      }

      msg.statusCode = response.status;
      msg.headers = Object.fromEntries(response.headers.entries());

      this.send(msg);
    } catch (err) {
      this.error(err.message);
      msg.payload = null;
      msg.statusCode = 0;
      msg.error = err.message;
      this.send(msg);
    }
  }
};
