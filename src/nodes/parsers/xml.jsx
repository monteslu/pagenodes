export const xmlNode = {
  type: 'xml',
  category: 'function',
  label: (node) => node._node.name || 'xml',
  color: '#DEBD5C', // light tan/gold
  icon: true,
  faChar: '\uf1c9', // file-code-o
  inputs: 1,
  outputs: 1,

  defaults: {
    action: { type: 'select', default: 'auto', options: [
      { value: 'auto', label: 'Convert to/from XML (auto)' },
      { value: 'str', label: 'Always convert to XML string' },
      { value: 'obj', label: 'Always parse to Object' }
    ]},
    property: { type: 'string', default: 'payload' },
    attrkey: { type: 'string', default: '$' },
    charkey: { type: 'string', default: '_' }
  }
};
