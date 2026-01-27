/**
 * MCP Output Node - Sends messages to the MCP queue or an AI gateway for agent consumption
 */
export const mcpOutputNode = {
  type: 'mcp-output',
  category: 'ai',
  description: 'Sends text to MCP queue or Moltbot/Clawdbot gateway',
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
    topic: { type: 'string', default: '', label: 'Topic' },
    useGateway: {
      type: 'checkbox',
      default: false,
      label: 'Send to gateway',
      description: 'POST messages to an AI gateway (Moltbot/Clawdbot) instead of queueing for MCP polling'
    },
    gatewayHost: {
      type: 'string',
      default: '127.0.0.1:18789',
      label: 'Gateway host:port',
      placeholder: '127.0.0.1:18789'
    },
    gatewayKey: {
      type: 'password',
      default: '',
      label: 'Gateway auth key'
    }
  },

  messageInterface: {
    reads: {
      payload: {
        type: 'string',
        description: 'Text message to send to MCP queue or gateway',
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
        <p>Sends text messages to AI agents. Messages can be delivered in two ways:</p>
        <ul>
          <li><strong>MCP queue</strong> (default) — messages are queued and retrieved by AI agents polling via the <code>get_mcp_messages</code> MCP tool.</li>
          <li><strong>Gateway</strong> — messages are POSTed directly to an AI gateway (such as Moltbot or Clawdbot), which immediately wakes the agent. This enables out-of-band activation — the agent responds to events without polling.</li>
        </ul>

        <h5>Use Cases</h5>
        <ul>
          <li>Voice recognition output to AI conversation</li>
          <li>Sensor alerts for AI to respond to</li>
          <li>Event notifications for AI processing</li>
          <li>Out-of-band agent activation via gateway</li>
        </ul>

        <h5>Input</h5>
        <ul>
          <li><code>msg.payload</code> - Text message to send</li>
          <li><code>msg.topic</code> - Optional topic (overrides node setting)</li>
        </ul>

        <h5>MCP Queue Mode</h5>
        <p>AI agents retrieve messages using the <code>get_mcp_messages</code> tool,
        which returns and clears the queue.</p>

        <h5>Gateway Mode</h5>
        <p>Enable <strong>Send to gateway</strong> and configure the host:port and auth key.
        Messages are POSTed to the gateway&apos;s WebSocket HTTP endpoint, immediately triggering
        an agent run. Compatible with Moltbot/Clawdbot gateways.</p>

        <h5>Example</h5>
        <p>Wire a <strong>voicerec</strong> node to this node to enable voice conversations with an AI agent.
        Use gateway mode to get immediate responses without waiting for MCP polling.</p>
      </>
    );
  }
};
