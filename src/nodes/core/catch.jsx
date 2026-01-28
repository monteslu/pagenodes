// Catch node - catches errors from other nodes

export const catchNode = {
  type: 'catch',
  category: 'input',
  description: 'Catches errors from other nodes in the flow',
  label: (node) => node.name || 'catch',
  color: '#e49191',
  icon: true,
  faChar: '\uf071', // warning triangle
  inputs: 0,
  outputs: 1,

  defaults: {
    name: { type: 'string', default: '' },
    scope: {
      type: 'select',
      default: 'all',
      options: [
        { value: 'all', label: 'All nodes' },
        { value: 'uncaught', label: 'Uncaught errors only' }
      ],
      label: 'Catch errors from'
    }
  },

  messageInterface: {
    writes: {
      error: {
        type: 'object',
        description: 'Error details: { message, source: { id, type, name } }'
      },
      payload: {
        type: 'any',
        description: 'Original message payload (if available)'
      },
      _msgid: {
        type: 'string',
        description: 'Original message ID for tracing'
      }
    }
  },

  renderHelp() {
    return (
      <>
        <p>Catches errors thrown by other nodes in the flow.</p>

        <h5>Configuration</h5>
        <ul>
          <li><strong>All nodes</strong> - Catches errors from any node in the flow</li>
          <li><strong>Uncaught errors only</strong> - Only catches errors not handled by another catch node</li>
        </ul>

        <h5>Output</h5>
        <ul>
          <li><code>msg.error.message</code> - The error message</li>
          <li><code>msg.error.source.id</code> - ID of the node that errored</li>
          <li><code>msg.error.source.type</code> - Type of the node that errored</li>
          <li><code>msg.error.source.name</code> - Name of the node that errored</li>
          <li><code>msg._msgid</code> - Original message ID (if available)</li>
        </ul>

        <h5>Example</h5>
        <p>Connect a catch node to a debug node to see all errors in your flow.</p>
      </>
    );
  }
};
