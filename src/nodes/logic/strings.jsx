export const stringsNode = {
  type: 'strings',
  category: 'function',
  label: (node) => node._node.name || 'strings',
  color: '#66d9ef', // light blue
  icon: true,
  faChar: '\uf031', // font
  inputs: 1,
  outputs: 1,

  defaults: {
    operation: { type: 'select', default: 'toLowerCase', options: [
      { value: 'toLowerCase', label: 'To Lower Case' },
      { value: 'toUpperCase', label: 'To Upper Case' },
      { value: 'trim', label: 'Trim' },
      { value: 'trimStart', label: 'Trim Start' },
      { value: 'trimEnd', label: 'Trim End' },
      { value: 'length', label: 'Length' },
      { value: 'charAt', label: 'Char At Index' },
      { value: 'concat', label: 'Concatenate' },
      { value: 'includes', label: 'Includes' },
      { value: 'indexOf', label: 'Index Of' },
      { value: 'lastIndexOf', label: 'Last Index Of' },
      { value: 'replace', label: 'Replace' },
      { value: 'replaceAll', label: 'Replace All' },
      { value: 'slice', label: 'Slice' },
      { value: 'split', label: 'Split' },
      { value: 'substring', label: 'Substring' },
      { value: 'repeat', label: 'Repeat' },
      { value: 'padStart', label: 'Pad Start' },
      { value: 'padEnd', label: 'Pad End' },
      { value: 'startsWith', label: 'Starts With' },
      { value: 'endsWith', label: 'Ends With' },
      { value: 'match', label: 'Match (Regex)' }
    ]},
    arg1: { type: 'string', default: '' },
    arg2: { type: 'string', default: '' }
  }
};
