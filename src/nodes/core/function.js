// Function node - Runtime implementation
// UI definition is in function.jsx

export const functionRuntime = {
  type: 'function',

  onInit() {
    // Create the main function from the code string
    try {
      const code = this.config.func || 'return msg;';
      this._func = new Function('msg', 'node', 'context', 'flow', 'global', `
        ${code}
      `);
      this.status(null);
    } catch (err) {
      this._func = null;
      this.status({ text: err.message, fill: 'red' });
      this.error('Function compilation error: ' + err.message);
      return;
    }

    // Run initialize code if provided
    if (this.config.initialize) {
      try {
        const initFunc = new Function('node', 'context', 'flow', 'global', `
          ${this.config.initialize}
        `);
        const ctx = this.context();
        initFunc(this, ctx, ctx.flow, ctx.global);
      } catch (err) {
        this.status({ text: 'Init: ' + err.message, fill: 'red' });
        this.error('Initialize error: ' + err.message);
      }
    }
  },

  onClose() {
    // Run finalize code if provided
    if (this.config.finalize) {
      try {
        const finalizeFunc = new Function('node', 'context', 'flow', 'global', `
          ${this.config.finalize}
        `);
        const ctx = this.context();
        finalizeFunc(this, ctx, ctx.flow, ctx.global);
      } catch (err) {
        this.error('Finalize error: ' + err.message);
      }
    }
  },

  onInput(msg) {
    if (!this._func) return;

    this.status(null); // Clear status when starting

    try {
      const ctx = this.context();
      const result = this._func(msg, this, ctx, ctx.flow, ctx.global);

      // Handle both sync and async results
      if (result instanceof Promise) {
        result
          .then(asyncResult => {
            if (asyncResult !== undefined) {
              this.send(asyncResult);
            }
          })
          .catch(err => {
            this.status({ text: err.message, fill: 'red' });
            this.error('Function error: ' + err.message, msg);
          });
      } else if (result !== undefined) {
        this.send(result);
      }
    } catch (err) {
      this.status({ text: err.message, fill: 'red' });
      this.error('Function error: ' + err.message, msg);
    }
  }
};
