export const jsonNode = {
  type: 'json',
  category: 'function',
  label: (node) => node._node.name || 'json',
  color: '#DEBD5C', // light tan/gold
  icon: true,
  faChar: '\uf1c9', // file-code-o
  inputs: 1,
  outputs: 1,

  defaults: {
    action: { type: 'select', default: 'auto', options: [
      { value: 'auto', label: 'Convert to/from JSON (auto)' },
      { value: 'str', label: 'Always convert to JSON string' },
      { value: 'obj', label: 'Always parse to Object' }
    ]},
    property: { type: 'string', default: 'payload' },
    pretty: { type: 'boolean', default: false }
  }
};
