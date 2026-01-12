export const collectionsNode = {
  type: 'collections',
  category: 'function',
  label: (node) => node._node.name || 'collections',
  color: '#66d9ef', // light blue
  icon: true,
  faChar: '\uf1b3', // cubes
  inputs: 1,
  outputs: 1,

  defaults: {
    operation: { type: 'select', default: 'keys', options: [
      { value: 'keys', label: 'Keys' },
      { value: 'values', label: 'Values' },
      { value: 'entries', label: 'Entries' },
      { value: 'fromEntries', label: 'From Entries' },
      { value: 'assign', label: 'Assign/Merge' },
      { value: 'pick', label: 'Pick' },
      { value: 'omit', label: 'Omit' },
      { value: 'get', label: 'Get Property' },
      { value: 'set', label: 'Set Property' },
      { value: 'has', label: 'Has Property' },
      { value: 'delete', label: 'Delete Property' },
      { value: 'size', label: 'Size' },
      { value: 'isEmpty', label: 'Is Empty' },
      { value: 'clone', label: 'Clone (shallow)' },
      { value: 'cloneDeep', label: 'Clone (deep)' },
      { value: 'freeze', label: 'Freeze' },
      { value: 'invert', label: 'Invert' },
      { value: 'mapKeys', label: 'Map Keys' },
      { value: 'mapValues', label: 'Map Values' },
      { value: 'groupBy', label: 'Group By' },
      { value: 'sortBy', label: 'Sort By' }
    ]},
    arg1: { type: 'string', default: '' },
    arg2: { type: 'string', default: '' }
  }
};
