// Shared relatedDocs for Socket.IO nodes
const socketioRelatedDocs = [
  { label: 'Socket.IO Documentation', url: 'https://socket.io/docs/v4/' },
  { label: 'Socket.IO Client API', url: 'https://socket.io/docs/v4/client-api/' }
];

// Config node for Socket.IO connection
export const socketioClientNode = {
  type: 'socketio-client',
  category: 'config',
  description: 'Socket.IO client connection configuration',
  label: (node) => node._node.name || node._node.server || 'socketio-client',

  defaults: {
    name: { type: 'string', default: '' },
    server: { type: 'string', default: '', placeholder: 'https://example.com', label: 'Server', required: true },
    path: { type: 'string', default: '/socket.io', placeholder: 'Socket.IO path' }
  },

  renderHelp() {
    return (
      <>
        <p>Configuration node for Socket.IO connections. Referenced by Socket.IO In and Out nodes.</p>

        <h5>Configuration</h5>
        <ul>
          <li><strong>Server</strong> - Socket.IO server URL (https://)</li>
          <li><strong>Path</strong> - Socket.IO endpoint path (default: /socket.io)</li>
        </ul>

        <p>This config node is shared - multiple Socket.IO In/Out nodes can use the same connection.</p>
      </>
    );
  },

  relatedDocs: () => socketioRelatedDocs
};

export const socketioInNode = {
  type: 'socketio in',
  category: 'networking',
  description: 'Receives Socket.IO events',
  label: (node) => node._node.name || node.eventName || 'socket.io',
  color: '#d7d7a0', // pale yellowish
  icon: true,
  faChar: '\uf192', // dot-circle-o
  inputs: 0,
  outputs: 1,

  defaults: {
    client: { type: 'socketio-client', default: '', label: 'Client', required: true },
    eventName: { type: 'string', default: 'message' },
    namespace: { type: 'string', default: '/' }
  },

  messageInterface: {
    writes: {
      payload: {
        type: 'any',
        description: 'Event data from Socket.IO server'
      }
    }
  },

  renderHelp() {
    return (
      <>
        <p>Receives events from a Socket.IO server.</p>

        <h5>Configuration</h5>
        <ul>
          <li><strong>Client</strong> - Select or create a Socket.IO Client config</li>
          <li><strong>Event Name</strong> - Name of the event to listen for</li>
          <li><strong>Namespace</strong> - Socket.IO namespace (default: /)</li>
        </ul>

        <h5>Output</h5>
        <ul>
          <li><code>msg.payload</code> - The event data</li>
        </ul>

        <h5>Use Cases</h5>
        <ul>
          <li>Real-time chat applications</li>
          <li>Live dashboards</li>
          <li>Multiplayer games</li>
        </ul>
      </>
    );
  },

  relatedDocs: () => socketioRelatedDocs
};

export const socketioOutNode = {
  type: 'socketio out',
  category: 'networking',
  description: 'Sends Socket.IO events',
  label: (node) => node._node.name || node.eventName || 'socket.io',
  color: '#d7d7a0', // pale yellowish
  icon: true,
  faChar: '\uf192', // dot-circle-o
  inputs: 1,
  outputs: 0,

  defaults: {
    client: { type: 'socketio-client', default: '', label: 'Client', required: true },
    eventName: { type: 'string', default: 'message' },
    namespace: { type: 'string', default: '/' },
    broadcast: { type: 'boolean', default: false }
  },

  messageInterface: {
    reads: {
      payload: {
        type: 'any',
        description: 'Data to send with the event',
        required: true
      },
      event: {
        type: 'string',
        description: 'Event name to emit (overrides config)',
        optional: true
      }
    }
  },

  renderHelp() {
    return (
      <>
        <p>Sends events to a Socket.IO server.</p>

        <h5>Configuration</h5>
        <ul>
          <li><strong>Client</strong> - Select or create a Socket.IO Client config</li>
          <li><strong>Event Name</strong> - Name of the event to emit</li>
          <li><strong>Namespace</strong> - Socket.IO namespace (default: /)</li>
          <li><strong>Broadcast</strong> - Broadcast to all connected clients (server-side feature)</li>
        </ul>

        <h5>Input</h5>
        <ul>
          <li><code>msg.payload</code> - Data to send with the event</li>
          <li><code>msg.event</code> - Override the event name (optional)</li>
        </ul>
      </>
    );
  },

  relatedDocs: () => socketioRelatedDocs
};
