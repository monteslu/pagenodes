// Local storage nodes - Runtime implementation
// Delegates to main thread for localStorage/sessionStorage access

export const localreadRuntime = {
  type: 'localread',

  onInput(msg) {
    const key = msg.key || this.config.key;
    if (!key) {
      this.error('No key specified');
      return;
    }

    this.mainThread('read', {
      key,
      storage: this.config.storage || 'local'
    });
  }
};

export const localwriteRuntime = {
  type: 'localwrite',

  onInput(msg) {
    const key = msg.key || this.config.key;
    if (!key) {
      this.error('No key specified');
      return;
    }

    this.mainThread('write', {
      key,
      value: msg.payload,
      storage: this.config.storage || 'local'
    });
  }
};
