/**
 * MCP Input Node - Runtime implementation
 *
 * Receives messages from AI agents via MCP send_mcp_message tool
 */
export const mcpInputRuntime = {
  type: 'mcp-input',

  onInit() {
    this.receivedCount = 0;
    this.mcpConnected = false;
    this.updateStatus();

    // Listen for MCP connection status changes
    this.on('mcpConnectionStatus', ({ status }) => {
      this.mcpConnected = status === 'connected';
      this.updateStatus();
    });

    // Listen for messages from main thread
    this.on('mcpMessage', (msg) => {
      // Filter by topic if configured
      const topicFilter = this.config.topic || '';
      if (topicFilter && msg.topic !== topicFilter) {
        return; // Skip messages that don't match topic filter
      }

      this.receivedCount++;
      this.updateStatus();
      this.send({
        payload: msg.payload,
        topic: msg.topic || 'mcp-in'
      });
    });
  },

  updateStatus() {
    if (!this.mcpConnected) {
      this.status({ text: 'MCP disconnected', fill: 'red' });
    } else if (this.receivedCount > 0) {
      this.status({ text: `Received: ${this.receivedCount}`, fill: 'green' });
    } else {
      this.status({ text: 'Ready', fill: 'green' });
    }
  }
};
