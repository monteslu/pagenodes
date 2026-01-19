export const joinNode = {
  type: 'join',
  category: 'transforms',
  description: 'Joins message sequences into a single message',
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

  messageInterface: {
    reads: {
      payload: {
        type: 'any',
        description: 'Value to join with others'
      },
      parts: {
        type: 'object',
        description: 'Sequence info from split node (optional)',
        optional: true
      }
    },
    writes: {
      payload: {
        type: ['array', 'object', 'string', 'Uint8Array'],
        description: 'Joined result (array, object, string, or buffer)'
      }
    }
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
  },

  renderHelp() {
    return (
      <>
        <p>Joins a sequence of messages into a single message. Works with messages from a Split node or collects messages manually.</p>

        <h5>Modes</h5>
        <ul>
          <li><strong>Automatic</strong> - Reassemble messages from a Split node using <code>msg.parts</code></li>
          <li><strong>Manual</strong> - Collect a fixed number of messages</li>
          <li><strong>Reduce sequence</strong> - Apply a reducer function to accumulate values</li>
        </ul>

        <h5>Output Types</h5>
        <ul>
          <li><strong>Array</strong> - Collect payloads into an array</li>
          <li><strong>Key/value object</strong> - Merge objects into one</li>
          <li><strong>Merged string</strong> - Concatenate with optional joiner</li>
          <li><strong>Buffer</strong> - Combine into binary buffer</li>
        </ul>

        <h5>Options</h5>
        <ul>
          <li><strong>Message count</strong> - Number of messages to collect (0 = use msg.parts.count)</li>
          <li><strong>Join character</strong> - Separator when building strings</li>
        </ul>

        <h5>Example</h5>
        <p>Collect 10 sensor readings into an array for batch processing.</p>
      </>
    );
  }
};
