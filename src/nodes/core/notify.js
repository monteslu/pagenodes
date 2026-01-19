// Notify node - Runtime implementation
// Delegates to main thread for browser Notification API

export const notifyRuntime = {
  type: 'notify',

  onInput(msg) {
    const title = msg.title || this.config.title || 'PageNodes';
    const body = typeof msg.payload === 'string' ? msg.payload : JSON.stringify(msg.payload);
    const icon = msg.icon || '/favicon.ico';  // Default to favicon, can override via msg
    const tag = msg.tag || this.config.tag || undefined;
    const requireInteraction = this.config.requireInteraction || false;
    const silent = this.config.silent || false;

    // Optional message-level properties
    const image = msg.image || undefined;
    const data = msg.data || undefined;
    const renotify = msg.renotify || false;

    this.mainThread('show', {
      title,
      body,
      icon,
      tag,
      requireInteraction,
      silent,
      image,
      data,
      renotify
    });
  }
};
