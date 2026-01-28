/**
 * MCP Input Node - Receives messages from AI agents via MCP
 */
export const mcpInputNode = {
  type: 'mcp-input',
  category: 'ai',
  description: 'Receives messages from AI agents via MCP',
  paletteLabel: 'mcp-in',
  label: (node) => node.name || 'mcp-in',
  color: '#a66bbf',  // Purple for AI nodes
  fontColor: '#fff',
  icon: true,
  faChar: '\uf0e0',  // envelope
  faColor: 'rgba(255,255,255,0.9)',

  inputs: 0,
  outputs: 1,

  defaults: {
    topic: { type: 'string', default: '', label: 'Topic filter', description: 'Only receive messages with this topic (empty = all)' }
  },

  messageInterface: {
    writes: {
      payload: {
        type: 'any',
        description: 'Message content from AI agent'
      },
      topic: {
        type: 'string',
        description: 'Message topic'
      }
    }
  },

  renderHelp() {
    return (
      <>
        <p>Receives messages sent by AI agents via the MCP <code>send_mcp_message</code> tool.</p>

        <h5>Use Cases</h5>
        <ul>
          <li>AI-initiated speech output</li>
          <li>AI controlling flows and devices</li>
          <li>Two-way AI conversation flows</li>
        </ul>

        <h5>Options</h5>
        <ul>
          <li><strong>Topic filter</strong> - Only receive messages with matching topic (leave empty to receive all)</li>
        </ul>

        <h5>Output</h5>
        <ul>
          <li><code>msg.payload</code> - Message content</li>
          <li><code>msg.topic</code> - Message topic</li>
        </ul>

        <h5>Example</h5>
        <p>Wire this node to a <strong>speech</strong> node to let AI agents speak to you.</p>
      </>
    );
  }
};
