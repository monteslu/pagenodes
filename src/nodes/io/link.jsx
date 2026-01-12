export const linkInNode = {
  type: 'link in',
  category: 'common',
  label: (node) => node._node.name || 'link in',
  color: '#ddd',
  icon: true,
  faChar: '\uf090', // sign-in
  inputs: 0,
  outputs: 1,

  defaults: {
    links: { type: 'string', default: '' } // Comma-separated list of link out node IDs
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
  }
};

export const linkOutNode = {
  type: 'link out',
  category: 'common',
  label: (node) => node._node.name || 'link out',
  color: '#ddd',
  icon: true,
  faChar: '\uf08b', // sign-out
  inputs: 1,
  outputs: 0,

  defaults: {
    links: { type: 'string', default: '' } // Comma-separated list of link in node IDs
  },

  onInput(msg) {
    const links = (this.config.links || '').split(',').filter(Boolean);

    for (const linkId of links) {
      const linkIn = this.flow?.linkNodes?.get(linkId.trim());
      if (linkIn && typeof linkIn.receive === 'function') {
        linkIn.receive({ ...msg });
      }
    }
  }
};

export const linkCallNode = {
  type: 'link call',
  category: 'common',
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
  }
};
