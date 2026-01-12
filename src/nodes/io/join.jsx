export const joinNode = {
  type: 'join',
  category: 'sequence',
  label: (node) => node._node.name || 'join',
  color: '#e2d96e',
  icon: true,
  faChar: '\uf247', // object-group
  inputs: 1,
  outputs: 1,

  defaults: {
    mode: {
      type: 'select',
      default: 'auto',
      options: [
        { value: 'auto', label: 'Automatic' },
        { value: 'manual', label: 'Manual' },
        { value: 'reduce', label: 'Reduce sequence' }
      ]
    },
    build: {
      type: 'select',
      default: 'array',
      options: [
        { value: 'array', label: 'Array' },
        { value: 'object', label: 'Key/value object' },
        { value: 'string', label: 'Merged string' },
        { value: 'buffer', label: 'Buffer' }
      ]
    },
    count: { type: 'number', default: 0, placeholder: 'Message count (0 = auto)' },
    joiner: { type: 'string', default: '', placeholder: 'Join character' }
  },

  onInit() {
    this._parts = new Map();
  },

  onInput(msg) {
    const parts = msg.parts;

    if (!parts || parts.index === undefined) {
      // No parts info - accumulate messages
      if (!this._accumulator) this._accumulator = [];
      this._accumulator.push(msg.payload);

      const count = this.config.count || 0;
      if (count > 0 && this._accumulator.length >= count) {
        this.sendJoined();
      }
      return;
    }

    // Handle split messages
    const key = parts.id || 'default';
    if (!this._parts.has(key)) {
      this._parts.set(key, { expected: parts.count, received: [] });
    }

    const group = this._parts.get(key);
    group.received[parts.index] = msg.payload;

    // Check if complete
    const received = group.received.filter(x => x !== undefined).length;
    if (received === group.expected) {
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
      case 'string':
        return arr.join(joiner || '');
      case 'object':
        return Object.assign({}, ...arr);
      case 'buffer':
        return new Uint8Array(arr.flat());
      default:
        return arr;
    }
  },

  onClose() {
    this._parts.clear();
    this._accumulator = [];
  }
};
