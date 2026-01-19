export const arraysNode = {
  type: 'arrays',
  category: 'logic',
  description: 'Performs array operations',
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
  },

  messageInterface: {
    reads: {
      payload: {
        type: 'array',
        description: 'Array to perform operation on'
      }
    },
    writes: {
      payload: {
        type: 'any',
        description: 'Operation result (array, value, boolean, or number depending on operation)'
      }
    }
  },

  renderHelp() {
    return (
      <>
        <p>Performs array manipulation operations on <code>msg.payload</code>.</p>

        <h5>Operations</h5>
        <ul>
          <li><strong>Add/Remove</strong>: Push, Pop, Shift, Unshift, Splice</li>
          <li><strong>Extract</strong>: Slice, First, Last, Sample</li>
          <li><strong>Transform</strong>: Reverse, Sort, Unique, Compact, Shuffle, Flat</li>
          <li><strong>Combine</strong>: Concat, Join, Chunk</li>
          <li><strong>Query</strong>: Length, Index Of, Includes, Find</li>
          <li><strong>Iterate</strong>: Filter, Map, Reduce, Every, Some</li>
          <li><strong>Set operations</strong>: Difference, Intersection, Union</li>
        </ul>

        <h5>Arguments</h5>
        <ul>
          <li><strong>Push/Unshift</strong>: arg1 = value to add</li>
          <li><strong>Slice</strong>: arg1 = start, arg2 = end</li>
          <li><strong>Join</strong>: arg1 = separator</li>
          <li><strong>Chunk</strong>: arg1 = chunk size</li>
          <li><strong>Fill</strong>: arg1 = value</li>
        </ul>

        <h5>Example</h5>
        <p>Get unique sorted values:</p>
        <ol>
          <li>Unique (remove duplicates)</li>
          <li>Sort</li>
        </ol>
      </>
    );
  }
};
