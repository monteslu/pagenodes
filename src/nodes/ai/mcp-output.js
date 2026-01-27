/**
 * MCP Output Node - Runtime implementation
 *
 * Queues messages for MCP consumption via the mcp-messages tool,
 * or POSTs directly to an AI gateway (Moltbot/Clawdbot) for immediate agent activation.
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
    if (!this.config.useGateway) {
      const initialCount = await this.mainThreadCall('mcpGetQueueCount', { nodeId: this.id });
      this.queueCount = initialCount || 0;
    }
    this.updateStatus();
  },

  updateStatus() {
    if (this.config.useGateway) {
      this.status({ text: `Gateway: ${this.config.gatewayHost || '?'}`, fill: 'green' });
    } else if (!this.mcpConnected) {
      this.status({ text: 'MCP disconnected', fill: 'red' });
    } else if (this.queueCount > 0) {
      this.status({ text: `Queued: ${this.queueCount}`, fill: 'blue' });
    } else {
      this.status({ text: 'Ready', fill: 'green' });
    }
  },

  async onInput(msg) {
    const text = typeof msg.payload === 'string'
      ? msg.payload
      : JSON.stringify(msg.payload);

    const topic = msg.topic || this.config.topic || '';

    if (!text || text.trim() === '') {
      return;
    }

    if (this.config.useGateway) {
      await this.sendToGateway(text.trim(), topic);
    } else {
      // Send to MCP queue via the worker's MCP integration
      this.mainThread('mcpQueueMessage', {
        text: text.trim(),
        topic,
        nodeId: this.id,
        nodeName: this.name || 'mcp-out',
        timestamp: Date.now()
      });
    }
  },

  async sendToGateway(text, topic) {
    const host = this.config.gatewayHost || '127.0.0.1:18789';
    const key = this.config.gatewayKey || '';
    const url = `http://${host}/`;

    const body = {
      type: 'req',
      id: `pn-${Date.now()}`,
      method: 'send',
      params: {
        text: topic ? `[${topic}] ${text}` : text
      }
    };

    try {
      this.status({ text: 'Sending...', fill: 'blue' });
      const headers = { 'Content-Type': 'application/json' };
      if (key) {
        headers['Authorization'] = `Bearer ${key}`;
      }
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });

      if (response.ok) {
        this.status({ text: `Gateway: ${host}`, fill: 'green' });
      } else {
        this.status({ text: `${response.status}`, fill: 'yellow' });
        this.warn(`Gateway responded ${response.status}`);
      }
    } catch (err) {
      this.status({ text: err.message, fill: 'red' });
      this.error(`Gateway error: ${err.message}`);
    }
  }
};
