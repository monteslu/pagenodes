export const debugNode = {
  type: 'debug',
  category: 'output',
  label: (node) => node._node.name || 'debug',
  color: '#87a980',
  icon: true,
  faChar: '\uf188', // bug
  inputs: 1,
  outputs: 0,

  defaults: {
    active: { type: 'boolean', default: true },
    tosidebar: { type: 'boolean', default: true },
    console: { type: 'boolean', default: false },
    complete: {
      type: 'select',
      default: 'payload',
      options: [
        { value: 'payload', label: 'msg.payload' },
        { value: 'true', label: 'Complete msg object' }
      ]
    }
  },

  onInput(msg) {
    if (!this.config.active) return;

    const output = this.config.complete === 'true' ? msg : msg.payload;

    if (this.config.tosidebar) {
      this.status({ text: typeof output === 'object' ? JSON.stringify(output) : String(output) });
      this.debug(output);
    }

    if (this.config.console) {
      console.log('[debug]', this._node.name || this._node.id, output);
    }
  }
};
