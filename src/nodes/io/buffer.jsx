export const bufferNode = {
  type: 'buffer',
  category: 'function',
  label: (node) => node._node.name || 'buffer',
  color: '#DEBD5C', // light tan/gold
  icon: true,
  faChar: '\uf0c5', // files-o
  inputs: 1,
  outputs: 1,

  defaults: {
    mode: { type: 'select', default: 'count', options: [
      { value: 'count', label: 'Collect count messages' },
      { value: 'interval', label: 'Send every interval' },
      { value: 'concat', label: 'Concatenate sequences' }
    ]},
    count: { type: 'number', default: 5 },
    interval: { type: 'number', default: 1000 },
    overlap: { type: 'number', default: 0 },
    timeout: { type: 'number', default: 0 }
  }
};
