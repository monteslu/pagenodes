export const eventsourceNode = {
  type: 'eventsource',
  category: 'networking',
  description: 'Connects to Server-Sent Events stream',
  label: (node) => node.name || 'SSE',
  color: '#ffd7b4', // light peach/salmon
  icon: true,
  faChar: '\uf019', // download
  inputs: 0,
  outputs: 1,

  defaults: {
    url: { type: 'string', default: '', label: 'URL', required: true },
    eventType: { type: 'string', default: 'message' },
    withCredentials: { type: 'boolean', default: false }
  },

  messageInterface: {
    writes: {
      payload: {
        type: 'any',
        description: 'Event data (auto-parsed as JSON if possible)'
      },
      event: {
        type: 'string',
        description: 'Event type'
      },
      lastEventId: {
        type: 'string',
        description: 'Event ID from server (if provided)',
        optional: true
      }
    }
  },

  renderHelp() {
    return (
      <>
        <p>Connects to a Server-Sent Events (SSE) stream and outputs received events as messages.</p>

        <h5>Configuration</h5>
        <ul>
          <li><strong>URL</strong> - The SSE endpoint URL</li>
          <li><strong>Event Type</strong> - Which event type to listen for (default: "message")</li>
          <li><strong>With Credentials</strong> - Include cookies in cross-origin requests</li>
        </ul>

        <h5>Output</h5>
        <ul>
          <li><code>msg.payload</code> - The event data (auto-parsed as JSON if possible)</li>
          <li><code>msg.event</code> - The event type</li>
          <li><code>msg.lastEventId</code> - The event ID (if provided by server)</li>
        </ul>

        <h5>About SSE</h5>
        <p>Server-Sent Events is a standard for servers to push updates to browsers. Unlike WebSockets, SSE is one-way (server to client) but simpler and works over standard HTTP.</p>

        <h5>Use Cases</h5>
        <ul>
          <li>Real-time notifications</li>
          <li>Live data feeds</li>
          <li>Streaming API responses</li>
        </ul>
      </>
    );
  }
};
