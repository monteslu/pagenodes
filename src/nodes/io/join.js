// Join node - Runtime implementation

export const joinRuntime = {
  type: 'join',

  onInit() {
    this._parts = new Map();
    this._accumulator = [];
  },

  onInput(msg) {
    const parts = msg.parts;

    if (!parts || parts.index === undefined) {
      this._accumulator.push(msg.payload);

      const count = this.config.count || 0;
      if (count > 0 && this._accumulator.length >= count) {
        this.sendJoined();
      }
      return;
    }

    const key = parts.id || 'default';
    if (!this._parts.has(key)) {
      this._parts.set(key, { expected: parts.count, received: [] });
    }

    const group = this._parts.get(key);
    group.received[parts.index] = msg.payload;

    const receivedCount = group.received.filter(x => x !== undefined).length;
    if (receivedCount === group.expected) {
      msg.payload = this.buildOutput(group.received);
      delete msg.parts;
      this._parts.delete(key);
      this.send(msg);
    }
  },

  sendJoined() {
    const msg = { payload: this.buildOutput(this._accumulator) };
    this._accumulator = [];
    this.send(msg);
  },

  buildOutput(arr) {
    const { build, joiner } = this.config;
    switch (build) {
      case 'string': return arr.join(joiner || '');
      case 'object': return Object.assign({}, ...arr);
      case 'buffer': return new Uint8Array(arr.flat());
      default: return arr;
    }
  },

  onClose() {
    this._parts.clear();
    this._accumulator = [];
  }
};
