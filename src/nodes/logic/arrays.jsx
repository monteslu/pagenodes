export const arraysNode = {
  type: 'arrays',
  category: 'function',
  label: (node) => node._node.name || 'arrays',
  color: '#66d9ef', // light blue
  icon: true,
  faChar: '\uf0ca', // list-ul
  inputs: 1,
  outputs: 1,

  defaults: {
    operation: { type: 'select', default: 'push', options: [
      { value: 'push', label: 'Push' },
      { value: 'pop', label: 'Pop' },
      { value: 'shift', label: 'Shift' },
      { value: 'unshift', label: 'Unshift' },
      { value: 'slice', label: 'Slice' },
      { value: 'splice', label: 'Splice' },
      { value: 'concat', label: 'Concat' },
      { value: 'join', label: 'Join' },
      { value: 'reverse', label: 'Reverse' },
      { value: 'sort', label: 'Sort' },
      { value: 'length', label: 'Length' },
      { value: 'indexOf', label: 'Index Of' },
      { value: 'includes', label: 'Includes' },
      { value: 'find', label: 'Find' },
      { value: 'filter', label: 'Filter' },
      { value: 'map', label: 'Map' },
      { value: 'reduce', label: 'Reduce' },
      { value: 'every', label: 'Every' },
      { value: 'some', label: 'Some' },
      { value: 'flat', label: 'Flat' },
      { value: 'fill', label: 'Fill' },
      { value: 'first', label: 'First' },
      { value: 'last', label: 'Last' },
      { value: 'unique', label: 'Unique' },
      { value: 'compact', label: 'Compact (remove falsy)' },
      { value: 'shuffle', label: 'Shuffle' },
      { value: 'sample', label: 'Sample' },
      { value: 'chunk', label: 'Chunk' },
      { value: 'difference', label: 'Difference' },
      { value: 'intersection', label: 'Intersection' },
      { value: 'union', label: 'Union' }
    ]},
    arg1: { type: 'string', default: '' },
    arg2: { type: 'string', default: '' }
  }
};
