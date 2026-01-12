// Notify node - Runtime implementation
// Delegates to main thread for browser Notification API

export const notifyRuntime = {
  type: 'notify',

  onInput(msg) {
    const title = this.config.title || 'PageNodes';
    const body = typeof msg.payload === 'string' ? msg.payload : JSON.stringify(msg.payload);

    this.mainThread('show', { title, body });
  }
};
