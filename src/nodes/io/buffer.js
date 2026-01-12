// Buffer node - Runtime implementation

export const bufferRuntime = {
  type: 'buffer',

  onInit() {
    this._buffer = [];
    this._timer = null;

    if (this.config.mode === 'interval' && this.config.interval > 0) {
      this._timer = setInterval(() => this.flush(), this.config.interval);
    }
  },

  onInput(msg) {
    this._buffer.push(msg.payload);

    if (this.config.mode === 'count' && this._buffer.length >= (this.config.count || 5)) {
      this.flush();
    }
  },

  flush() {
    if (this._buffer.length > 0) {
      this.send({ payload: [...this._buffer] });
      this._buffer = [];
    }
  },

  onClose() {
    if (this._timer) clearInterval(this._timer);
    this._buffer = [];
  }
};
