// Config node for WebSocket connection
export const websocketClientNode = {
  type: 'websocket-client',
  category: 'config',
  description: 'WebSocket client connection configuration',
  label: (node) => node.name || node.url || 'websocket-client',

  defaults: {
    name: { type: 'string', default: '' },
    url: { type: 'string', default: '', placeholder: 'wss://example.com/socket', label: 'URL', required: true },
    subprotocol: { type: 'string', default: '', placeholder: 'Subprotocol (optional)' }
  },

  renderHelp() {
    return (
      <>
        <p>Configuration node for WebSocket connections. Referenced by WebSocket In and WebSocket Out nodes.</p>

        <h5>Configuration</h5>
        <ul>
          <li><strong>URL</strong> - WebSocket server URL (ws:// or wss://)</li>
          <li><strong>Subprotocol</strong> - Optional WebSocket subprotocol</li>
        </ul>

        <p>This config node is shared - multiple WebSocket In/Out nodes can use the same connection.</p>
      </>
    );
  }
};

export const websocketInNode = {
  type: 'websocket in',
  category: 'networking',
  description: 'Receives WebSocket messages',
  label: (node) => node.name || 'websocket',
  color: '#d7d7a0', // pale yellowish
  icon: true,
  faChar: '\uf0ec', // exchange
  inputs: 0,
  outputs: 1,

  defaults: {
    client: { type: 'websocket-client', default: '', label: 'Client', required: true },
    wholemsg: { type: 'boolean', default: false }
  },

  messageInterface: {
    writes: {
      payload: {
        type: 'any',
        description: 'Received message data (auto-parsed JSON if applicable)'
      }
    }
  },

  renderHelp() {
    return (
      <>
        <p>Receives messages from a WebSocket server. Connects using a WebSocket Client config node.</p>

        <h5>Configuration</h5>
        <ul>
          <li><strong>Client</strong> - Select or create a WebSocket Client config</li>
          <li><strong>Output entire message</strong> - Include WebSocket metadata in output</li>
        </ul>

        <h5>Output</h5>
        <ul>
          <li><code>msg.payload</code> - The received message data</li>
        </ul>

        <h5>Use Cases</h5>
        <ul>
          <li>Real-time data from WebSocket APIs</li>
          <li>Chat applications</li>
          <li>Live updates and notifications</li>
        </ul>
      </>
    );
  }
};

export const websocketOutNode = {
  type: 'websocket out',
  category: 'networking',
  description: 'Sends WebSocket messages',
  label: (node) => node.name || 'websocket',
  color: '#d7d7a0', // pale yellowish
  icon: true,
  faChar: '\uf0ec', // exchange
  inputs: 1,
  outputs: 0,

  defaults: {
    client: { type: 'websocket-client', default: '', label: 'Client', required: true }
  },

  messageInterface: {
    reads: {
      payload: {
        type: ['string', 'object'],
        description: 'Data to send (objects are JSON stringified)',
        required: true
      }
    }
  },

  renderHelp() {
    return (
      <>
        <p>Sends messages to a WebSocket server. Uses the same connection as WebSocket In nodes with the same config.</p>

        <h5>Configuration</h5>
        <ul>
          <li><strong>Client</strong> - Select or create a WebSocket Client config</li>
        </ul>

        <h5>Input</h5>
        <ul>
          <li><code>msg.payload</code> - Data to send (string or object)</li>
        </ul>

        <p>Objects are automatically JSON-stringified before sending.</p>
      </>
    );
  }
};
