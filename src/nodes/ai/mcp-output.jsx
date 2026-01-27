/**
 * MCP Output Node - Sends messages to the MCP queue for AI agent consumption
 */
export const mcpOutputNode = {
  type: 'mcp-output',
  category: 'ai',
  description: 'Sends text to the MCP message queue for AI agents',
  paletteLabel: 'mcp-out',
  label: (node) => node.name || 'mcp-out',
  color: '#a66bbf',  // Purple for AI nodes
  fontColor: '#fff',
  icon: true,
  faChar: '\uf0e0',  // envelope
  faColor: 'rgba(255,255,255,0.9)',

  inputs: 1,
  outputs: 0,

  defaults: {
    topic: { type: 'string', default: '', label: 'Topic' }
  },

  messageInterface: {
    reads: {
      payload: {
        type: 'string',
        description: 'Text message to send to MCP queue',
        required: true
      },
      topic: {
        type: 'string',
        description: 'Optional topic/category for the message',
        optional: true
      }
    }
  },

  renderHelp() {
    return (
      <>
        <p>Sends text messages to a queue that AI agents can read via MCP.</p>

        <h5>Use Cases</h5>
        <ul>
          <li>Voice recognition output to AI conversation</li>
          <li>Sensor alerts for AI to respond to</li>
          <li>Event notifications for AI processing</li>
        </ul>

        <h5>Input</h5>
        <ul>
          <li><code>msg.payload</code> - Text message to queue</li>
          <li><code>msg.topic</code> - Optional topic (overrides node setting)</li>
        </ul>

        <h5>MCP Integration</h5>
        <p>AI agents can retrieve messages using the <code>get_mcp_messages</code> tool,
        which returns and clears the queue.</p>

        <h5>Example</h5>
        <p>Wire a <strong>voicerec</strong> node to this node to enable voice conversations with an AI agent.</p>
      </>
    );
  }
};
