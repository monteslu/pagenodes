export const httpRequestNode = {
  type: 'http request',
  category: 'networking',
  description: 'Makes HTTP requests',
  label: (node) => node.name || node.method || 'http request',
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
    url: {
      type: 'string',
      default: '',
      label: 'URL',
      placeholder: 'https://example.com/api',
      description: 'Target URL for the request'
    }
  },

  messageInterface: {
    reads: {
      url: { type: 'string', description: 'Override the configured URL', optional: true },
      method: { type: 'string', description: 'Override the HTTP method', optional: true },
      payload: { type: 'any', description: 'Request body (for POST/PUT/PATCH)', optional: true },
      headers: { type: 'object', description: 'HTTP headers object', optional: true }
    },
    writes: {
      payload: { type: 'any', description: 'Response body (string, object, or ArrayBuffer)' },
      statusCode: { type: 'number', description: 'HTTP status code (200, 404, etc.)' },
      headers: { type: 'object', description: 'Response headers' }
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

      // Auto-detect response type from Content-Type header
      const contentType = response.headers.get('content-type') || '';
      let payload;

      if (contentType.includes('application/json')) {
        payload = await response.json();
      } else if (contentType.includes('text/')) {
        payload = await response.text();
      } else {
        payload = await response.arrayBuffer();
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
  },

  renderHelp({ mode } = {}) {
    return (
      <>
        <p>Makes HTTP requests and returns the response. Supports GET, POST, PUT, DELETE, PATCH, and HEAD methods.</p>

        {mode === 'browser' && (
          <>
            <h5>CORS Requirement</h5>
            <p><strong>Important:</strong> Since PageNodes is running in browser mode, the target server must have CORS (Cross-Origin Resource Sharing) enabled. If you get network errors, the server likely blocks cross-origin requests. Solutions:</p>
            <ul>
              <li>Use APIs that support CORS (most public APIs do)</li>
              <li>Use a CORS proxy service</li>
              <li>Add CORS headers to your own server</li>
              <li>Run PageNodes in server mode (no CORS restrictions)</li>
            </ul>
          </>
        )}

        <h5>Configuration</h5>
        <ul>
          <li><strong>Method</strong> - HTTP method (can be overridden by <code>msg.method</code>)</li>
          <li><strong>URL</strong> - Request URL (can be overridden by <code>msg.url</code>)</li>
        </ul>

        <h5>Response Parsing</h5>
        <p>The response is automatically parsed based on the Content-Type header:</p>
        <ul>
          <li><strong>application/json</strong> - Parsed as JSON object</li>
          <li><strong>text/*</strong> - Returned as UTF-8 string</li>
          <li><strong>Everything else</strong> - Returned as ArrayBuffer</li>
        </ul>

        <h5>Input</h5>
        <ul>
          <li><code>msg.url</code> - Override the configured URL</li>
          <li><code>msg.method</code> - Override the HTTP method</li>
          <li><code>msg.payload</code> - Request body (for POST/PUT/PATCH)</li>
          <li><code>msg.headers</code> - HTTP headers object</li>
        </ul>

        <h5>Output</h5>
        <ul>
          <li><code>msg.payload</code> - Response body</li>
          <li><code>msg.statusCode</code> - HTTP status code (200, 404, etc.)</li>
          <li><code>msg.headers</code> - Response headers</li>
        </ul>

        <h5>URL Templates</h5>
        <p>Use Mustache syntax in URLs: <code>{"https://api.example.com/users/{{payload.userId}}"}</code></p>
      </>
    );
  }
};
