export const stringsNode = {
  type: 'strings',
  category: 'logic',
  description: 'Performs string operations',
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
  },

  renderHelp() {
    return (
      <>
        <p>Performs string manipulation operations on <code>msg.payload</code>.</p>

        <h5>Operations</h5>
        <ul>
          <li><strong>Case</strong>: To Lower Case, To Upper Case</li>
          <li><strong>Trim</strong>: Trim, Trim Start, Trim End</li>
          <li><strong>Search</strong>: Includes, Index Of, Last Index Of, Starts With, Ends With, Match (Regex)</li>
          <li><strong>Extract</strong>: Char At, Slice, Substring, Length</li>
          <li><strong>Transform</strong>: Replace, Replace All, Split, Concat, Repeat</li>
          <li><strong>Padding</strong>: Pad Start, Pad End</li>
        </ul>

        <h5>Arguments</h5>
        <p>Some operations require arguments:</p>
        <ul>
          <li><strong>Replace</strong>: arg1 = search, arg2 = replacement</li>
          <li><strong>Slice/Substring</strong>: arg1 = start index, arg2 = end index</li>
          <li><strong>Split</strong>: arg1 = delimiter</li>
          <li><strong>Pad</strong>: arg1 = target length, arg2 = pad character</li>
        </ul>

        <h5>Example</h5>
        <p>Clean and format a name:</p>
        <ol>
          <li>Trim (remove whitespace)</li>
          <li>To Lower Case</li>
          <li>Replace " " with "_"</li>
        </ol>
      </>
    );
  }
};
