// Catch node - Runtime implementation
// Catches errors from other nodes and forwards them

export const catchRuntime = {
  type: 'catch',

  onInit() {
    // Register this catch node with the global catch registry
    // The registry is managed in the worker's handleError function
    this._scope = this.config.scope || 'all';

    // Catch nodes don't need any special initialization
    // They are passive receivers - the error routing system finds them
    this.status({ fill: 'grey', shape: 'ring', text: 'ready' });
  },

  // Catch nodes receive error messages via the error routing system
  // They don't have onInput - errors are delivered directly via send()

  onClose() {
    // Nothing to clean up
  }
};
