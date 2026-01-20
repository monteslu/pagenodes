export const linkInNode = {
  type: 'link in',
  category: 'common',
  description: 'Receives messages from link out nodes',
  label: (node) => node._node.name || 'link in',
  color: '#ddd',
  icon: true,
  faChar: '\uf090', // sign-in
  inputs: 0,
  outputs: 1,

  defaults: {
    links: { type: 'string', default: '' } // Comma-separated list of link out node IDs
  },

  messageInterface: {
    writes: {
      '*': {
        type: 'any',
        description: 'Message received from link out nodes (passes through unchanged)'
      }
    }
  },

  onInit() {
    // Register this node to receive messages from link out nodes
    if (this.flow?.linkNodes) {
      this.flow.linkNodes.set(this._node.id, this);
    }
  },

  receive(msg) {
    // Called by link out nodes
    this.send(msg);
  },

  onClose() {
    if (this.flow?.linkNodes) {
      this.flow.linkNodes.delete(this._node.id);
    }
  },

  renderHelp() {
    return (
      <>
        <p>Receives messages from Link Out nodes. Creates virtual wires that can cross between flows without visible connections.</p>

        <h5>Usage</h5>
        <ol>
          <li>Give this node a descriptive name</li>
          <li>In Link Out nodes, specify this node's ID in the "links" field</li>
          <li>Messages sent to the Link Out will appear here</li>
        </ol>

        <h5>Use Cases</h5>
        <ul>
          <li>Connect flows on different tabs</li>
          <li>Reduce wire clutter for complex flows</li>
          <li>Create reusable subflows</li>
        </ul>
      </>
    );
  }
};

export const linkOutNode = {
  type: 'link out',
  category: 'common',
  description: 'Sends messages to link in nodes',
  label: (node) => node._node.name || 'link out',
  color: '#ddd',
  icon: true,
  faChar: '\uf08b', // sign-out
  inputs: 1,
  outputs: 0,

  defaults: {
    links: { type: 'string', default: '' } // Comma-separated list of link in node IDs
  },

  messageInterface: {
    reads: {
      '*': {
        type: 'any',
        description: 'Message to forward to link in nodes (passes through unchanged)'
      }
    }
  },

  onInput(msg) {
    const links = (this.config.links || '').split(',').filter(Boolean);

    for (const linkId of links) {
      const linkIn = this.flow?.linkNodes?.get(linkId.trim());
      if (linkIn && typeof linkIn.receive === 'function') {
        linkIn.receive({ ...msg });
      }
    }
  },

  renderHelp() {
    return (
      <>
        <p>Sends messages to Link In nodes. Creates virtual wires that can cross between flows.</p>

        <h5>Configuration</h5>
        <ul>
          <li><strong>Links</strong> - Comma-separated list of Link In node IDs to send to</li>
        </ul>

        <h5>Usage</h5>
        <p>Messages arriving at this node are forwarded to all configured Link In nodes. The original message is cloned for each destination.</p>
      </>
    );
  }
};

export const linkCallNode = {
  type: 'link call',
  category: 'common',
  description: 'Calls a link in and waits for response',
  label: (node) => node._node.name || 'link call',
  color: '#ddd',
  icon: true,
  faChar: '\uf0c1', // link
  inputs: 1,
  outputs: 1,

  defaults: {
    links: { type: 'string', default: '' }, // Target link in node
    timeout: { type: 'number', default: 30 }
  },

  messageInterface: {
    reads: {
      '*': {
        type: 'any',
        description: 'Message to send to link in node'
      }
    },
    writes: {
      '*': {
        type: 'any',
        description: 'Response message from link return node'
      }
    }
  },

  onInit() {
    this._pending = new Map();
  },

  onInput(msg) {
    const linkId = (this.config.links || '').split(',')[0]?.trim();
    if (!linkId) {
      this.error('No link specified');
      return;
    }

    const callId = Math.random().toString(36).slice(2);
    msg._linkCall = {
      id: callId,
      source: this._node.id
    };

    // Set up timeout
    const timeout = (this.config.timeout || 30) * 1000;
    const timer = setTimeout(() => {
      this._pending.delete(callId);
      this.error('Link call timeout');
    }, timeout);

    this._pending.set(callId, { msg, timer });

    // Send to link in
    const linkIn = this.flow?.linkNodes?.get(linkId);
    if (linkIn && typeof linkIn.receive === 'function') {
      linkIn.receive(msg);
    }
  },

  handleReturn(msg) {
    const callId = msg._linkReturn?.id;
    if (!callId) return;

    const pending = this._pending.get(callId);
    if (pending) {
      clearTimeout(pending.timer);
      this._pending.delete(callId);
      delete msg._linkReturn;
      this.send(msg);
    }
  },

  onClose() {
    for (const { timer } of this._pending.values()) {
      clearTimeout(timer);
    }
    this._pending.clear();
  },

  renderHelp() {
    return (
      <>
        <p>Calls a Link In node and waits for a response. Similar to a function call - sends a message and expects a reply.</p>

        <h5>Configuration</h5>
        <ul>
          <li><strong>Link</strong> - The Link In node to call</li>
          <li><strong>Timeout</strong> - Seconds to wait for response (default: 30)</li>
        </ul>

        <h5>How It Works</h5>
        <ol>
          <li>Message is sent to the target Link In node</li>
          <li>The flow processes the message</li>
          <li>A Link Return node sends the response back</li>
          <li>This node outputs the response</li>
        </ol>

        <h5>Use Cases</h5>
        <ul>
          <li>Create reusable "function" subflows</li>
          <li>Call shared processing logic from multiple places</li>
        </ul>
      </>
    );
  }
};
