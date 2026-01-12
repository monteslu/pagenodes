export const httpRequestNode = {
  type: 'http request',
  category: 'network',
  label: (node) => node._node.name || node.method || 'http request',
  color: '#e7e7ae',
  icon: true,
  faChar: '\uf0ac', // globe
  inputs: 1,
  outputs: 1,

  defaults: {
    method: {
      type: 'select',
      default: 'GET',
      options: [
        { value: 'GET', label: 'GET' },
        { value: 'POST', label: 'POST' },
        { value: 'PUT', label: 'PUT' },
        { value: 'DELETE', label: 'DELETE' },
        { value: 'PATCH', label: 'PATCH' },
        { value: 'HEAD', label: 'HEAD' }
      ]
    },
    url: { type: 'string', default: '', placeholder: 'https://example.com/api' },
    ret: {
      type: 'select',
      default: 'txt',
      options: [
        { value: 'txt', label: 'a UTF-8 string' },
        { value: 'obj', label: 'a parsed JSON object' },
        { value: 'bin', label: 'a binary buffer' }
      ]
    }
  },

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

      let payload;
      const ret = this.config.ret || 'txt';

      if (ret === 'obj') {
        payload = await response.json();
      } else if (ret === 'bin') {
        payload = await response.arrayBuffer();
      } else {
        payload = await response.text();
      }

      msg.payload = payload;
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
