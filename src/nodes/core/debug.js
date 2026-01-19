// Debug node - Runtime implementation
// UI definition is in debug.jsx

export const debugRuntime = {
  type: 'debug',

  onInput(msg) {
    if (this.config.active === false) return;

    const output = this.config.complete === 'true' ? msg : msg.payload;

    if (this.config.tosidebar !== false) {
      this.debug(output, msg.topic || '', msg._msgid);
    }

    if (this.config.console) {
      console.log('[debug]', this.name || this.id, output);
    }
  }
};
