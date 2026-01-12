import { generateId } from '../../utils/id.js';

export const splitNode = {
  type: 'split',
  category: 'sequence',
  label: (node) => node._node.name || 'split',
  color: '#e2d96e',
  icon: true,
  faChar: '\uf248', // object-ungroup
  inputs: 1,
  outputs: 1,

  defaults: {
    splt: { type: 'string', default: '\\n', placeholder: 'Split character' },
    spltType: {
      type: 'select',
      default: 'str',
      options: [
        { value: 'str', label: 'String' },
        { value: 'len', label: 'Fixed length' }
      ]
    },
    arraySplt: { type: 'number', default: 1, placeholder: 'Array element count' },
    stream: { type: 'boolean', default: false }
  },

  onInput(msg) {
    const payload = msg.payload;
    let parts = [];

    if (Array.isArray(payload)) {
      const chunkSize = this.config.arraySplt || 1;
      for (let i = 0; i < payload.length; i += chunkSize) {
        parts.push(payload.slice(i, i + chunkSize));
      }
      if (parts.length > 0 && parts[parts.length - 1].length === 1) {
        parts[parts.length - 1] = parts[parts.length - 1][0];
      }
    } else if (typeof payload === 'string') {
      if (this.config.spltType === 'len') {
        const len = parseInt(this.config.splt) || 1;
        for (let i = 0; i < payload.length; i += len) {
          parts.push(payload.slice(i, i + len));
        }
      } else {
        const splitter = this.config.splt.replace(/\\n/g, '\n').replace(/\\t/g, '\t');
        parts = payload.split(splitter);
      }
    } else if (typeof payload === 'object' && payload !== null) {
      parts = Object.entries(payload).map(([key, value]) => ({ [key]: value }));
    } else {
      // Can't split, pass through
      this.send(msg);
      return;
    }

    const id = generateId();
    parts.forEach((part, index) => {
      const newMsg = { ...msg };
      newMsg.payload = part;
      newMsg.parts = {
        id,
        index,
        count: parts.length
      };
      this.send(newMsg);
    });
  }
};
