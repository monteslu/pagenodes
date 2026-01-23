/**
 * MCP Output Node - Runtime implementation
 *
 * Queues messages for MCP consumption via the mcp-messages tool
 */
export const mcpOutputRuntime = {
  type: 'mcp-output',

  async onInit() {
    this.queueCount = 0;
    this.mcpConnected = false;

    // Listen for MCP connection status changes
    this.on('mcpConnectionStatus', ({ status }) => {
      this.mcpConnected = status === 'connected';
      this.updateStatus();
    });

    // Listen for queue updates from main thread
    this.on('queueUpdate', (data) => {
      this.queueCount = data.count;
      this.updateStatus();
    });

    // Get initial queue count from main thread
    const initialCount = await this.mainThreadCall('mcpGetQueueCount', { nodeId: this.id });
    this.queueCount = initialCount || 0;
    this.updateStatus();
  },

  updateStatus() {
    if (!this.mcpConnected) {
      this.status({ text: 'MCP disconnected', fill: 'red' });
    } else if (this.queueCount > 0) {
      this.status({ text: `Queued: ${this.queueCount}`, fill: 'blue' });
    } else {
      this.status({ text: 'Ready', fill: 'green' });
    }
  },

  onInput(msg) {
    const text = typeof msg.payload === 'string'
      ? msg.payload
      : JSON.stringify(msg.payload);

    const topic = msg.topic || this.config.topic || '';

    if (!text || text.trim() === '') {
      return;
    }

    // Send to MCP queue via the worker's MCP integration
    this.mainThread('mcpQueueMessage', {
      text: text.trim(),
      topic,
      nodeId: this.id,
      nodeName: this.name || 'mcp-out',
      timestamp: Date.now()
    });
  }
};
