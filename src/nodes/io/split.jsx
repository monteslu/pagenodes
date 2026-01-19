import { generateId } from '../../utils/id.js';

export const splitNode = {
  type: 'split',
  category: 'logic',
  description: 'Splits a message into a sequence',
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

  messageInterface: {
    reads: {
      payload: {
        type: ['string', 'array', 'object'],
        description: 'Value to split (string, array, or object)'
      }
    },
    writes: {
      payload: {
        type: 'any',
        description: 'Individual split part'
      },
      parts: {
        type: 'object',
        description: 'Sequence info: {id, index, count}'
      }
    }
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
  },

  renderHelp() {
    return (
      <>
        <p>Splits a message into a sequence of messages. Each output message includes <code>msg.parts</code> with sequence information for later joining.</p>

        <h5>Split Behavior by Type</h5>
        <ul>
          <li><strong>String</strong> - Split by delimiter (default: newline <code>\n</code>) or fixed length</li>
          <li><strong>Array</strong> - Send each element as a separate message</li>
          <li><strong>Object</strong> - Send each key/value pair as a separate message</li>
        </ul>

        <h5>Options</h5>
        <ul>
          <li><strong>Split character</strong> - Delimiter for strings (supports <code>\n</code> and <code>\t</code>)</li>
          <li><strong>Fixed length</strong> - Split string into chunks of N characters</li>
          <li><strong>Array element count</strong> - Group array elements into chunks</li>
        </ul>

        <h5>Output</h5>
        <p>Each message includes:</p>
        <ul>
          <li><code>msg.parts.id</code> - Unique sequence identifier</li>
          <li><code>msg.parts.index</code> - Position in sequence (0-based)</li>
          <li><code>msg.parts.count</code> - Total number of parts</li>
        </ul>

        <h5>Example</h5>
        <p>Split CSV data: set delimiter to <code>,</code> to get each value as a separate message.</p>
      </>
    );
  }
};
