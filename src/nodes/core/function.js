// Function node - Runtime implementation
// UI definition is in function.jsx

export const functionRuntime = {
  type: 'function',

  onInit() {
    // Create the function from the code string
    try {
      const code = this.config.func || 'return msg;';
      // Create function with node context
      this._func = new Function('msg', 'node', 'context', 'flow', 'global', `
        ${code}
      `);
      this.status(null); // Clear any previous error status
    } catch (err) {
      this._func = null;
      this.status({ text: err.message, fill: 'red' });
      this.error('Function compilation error: ' + err.message);
    }
  },

  onInput(msg) {
    if (!this._func) return;

    this.status(null); // Clear status when starting

    try {
      const ctx = this.context();
      const result = this._func(msg, this, ctx, ctx.flow, ctx.global);

      if (result !== undefined) {
        this.send(result);
      }
    } catch (err) {
      this.status({ text: err.message, fill: 'red' });
      this.error('Function error: ' + err.message, msg);
    }
  }
};
