// Link nodes - Runtime implementation

export const linkInRuntime = {
  type: 'link in',

  receive(msg) {
    this.send(msg);
  }
};

export const linkOutRuntime = {
  type: 'link out',

  onInput(msg) {
    const links = (this.config.links || '').split(',').filter(Boolean);

    for (const linkId of links) {
      const linkIn = this.getNode(linkId.trim());
      if (linkIn && linkIn.type === 'link in') {
        linkIn.receive({ ...msg });
      }
    }
  }
};

export const linkCallRuntime = {
  type: 'link call',

  onInput(msg) {
    const linkId = (this.config.links || '').split(',')[0]?.trim();
    if (!linkId) {
      this.error('No link specified');
      return;
    }

    // For simplicity, just forward to link in
    const linkIn = this.getNode(linkId);
    if (linkIn && linkIn.type === 'link in') {
      linkIn.receive({ ...msg });
    }
  }
};
