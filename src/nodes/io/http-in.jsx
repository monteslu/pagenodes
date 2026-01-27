// HTTP In node - receives HTTP requests from the server router
// HTTP Response node - sends HTTP responses back to clients

export const httpInNode = {
  type: 'http in',
  category: 'networking',
  description: 'Receives HTTP requests (server mode only)',
  label: (node) => {
    const method = node.method || 'GET';
    const url = node.url || '';
    if (node.name) return node.name;
    return url ? `[${method}] ${url}` : 'http in';
  },
  color: '#e7e7ae',
  icon: true,
  faChar: '\uf090', // sign-in
  inputs: 0,
  outputs: 1,
  modes: ['server'],

  defaults: {
    method: {
      type: 'select',
      default: 'GET',
      options: [
        { value: 'GET', label: 'GET' },
        { value: 'POST', label: 'POST' },
        { value: 'PUT', label: 'PUT' },
        { value: 'DELETE', label: 'DELETE' },
        { value: 'PATCH', label: 'PATCH' }
      ]
    },
    url: {
      type: 'string',
      default: '',
      label: 'URL',
      placeholder: '/api/hello',
      required: true,
      description: 'Path to listen on (must start with /)'
    }
  },

  messageInterface: {
    writes: {
      payload: { type: 'any', description: 'Request body (parsed JSON or raw string)' },
      params: { type: 'object', description: 'URL parameters (e.g. /users/:id)' },
      query: { type: 'object', description: 'Query string parameters' },
      reqHeaders: { type: 'object', description: 'Request headers' },
      method: { type: 'string', description: 'HTTP method' },
      url: { type: 'string', description: 'Request URL path' },
      _res: { type: 'object', description: 'Internal: Fastify reply object for http-response node' }
    }
  },

  renderHelp() {
    return (
      <>
        <p>Listens for HTTP requests on the configured path and outputs a message for each request. Wire to an <strong>http response</strong> node to send a reply.</p>

        <h5>Configuration</h5>
        <ul>
          <li><strong>Method</strong> - HTTP method to listen for</li>
          <li><strong>URL</strong> - Path to listen on (e.g. <code>/api/hello</code> or <code>/users/:id</code>)</li>
        </ul>

        <h5>Output</h5>
        <ul>
          <li><code>msg.payload</code> - Request body (JSON auto-parsed), or query params for GET</li>
          <li><code>msg.params</code> - URL path parameters</li>
          <li><code>msg.query</code> - Query string parameters</li>
          <li><code>msg.reqHeaders</code> - Request headers</li>
          <li><code>msg.method</code> - HTTP method</li>
          <li><code>msg.url</code> - Request URL</li>
        </ul>

        <h5>Reserved Paths</h5>
        <p>The following paths are reserved and cannot be used:</p>
        <ul>
          <li><code>/</code> - Serves the editor UI</li>
          <li><code>/_pn/*</code> - Internal server endpoints</li>
        </ul>
      </>
    );
  }
};

export const httpResponseNode = {
  type: 'http response',
  category: 'networking',
  description: 'Sends HTTP response (server mode only)',
  label: (node) => node.name || 'http response',
  color: '#e7e7ae',
  icon: true,
  faChar: '\uf08b', // sign-out
  inputs: 1,
  outputs: 0,
  modes: ['server'],

  defaults: {
    statusCode: {
      type: 'number',
      default: 200,
      label: 'Status Code'
    },
    headers: {
      type: 'string',
      default: '',
      label: 'Headers (JSON)',
      placeholder: '{"Content-Type": "application/json"}'
    }
  },

  messageInterface: {
    reads: {
      payload: { type: 'any', description: 'Response body' },
      statusCode: { type: 'number', description: 'Override status code', optional: true },
      resHeaders: { type: 'object', description: 'Override response headers', optional: true },
      _res: { type: 'object', description: 'Internal: Fastify reply object from http-in node' }
    }
  },

  renderHelp() {
    return (
      <>
        <p>Sends an HTTP response back to the client. Must receive a message from an <strong>http in</strong> node (which provides the internal <code>msg._res</code> reply handle).</p>

        <h5>Configuration</h5>
        <ul>
          <li><strong>Status Code</strong> - Default HTTP status code (can be overridden by <code>msg.statusCode</code>)</li>
          <li><strong>Headers</strong> - Default response headers as JSON (can be overridden by <code>msg.headers</code>)</li>
        </ul>

        <h5>Input</h5>
        <ul>
          <li><code>msg.payload</code> - Response body (objects auto-serialized as JSON)</li>
          <li><code>msg.statusCode</code> - Override the configured status code</li>
          <li><code>msg.resHeaders</code> - Override response headers</li>
        </ul>
      </>
    );
  }
};
