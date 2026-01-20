export const arraysNode = {
  type: 'arrays',
  category: 'logic',
  description: 'Performs array operations using lodash',
  label: (node) => node._node.name || 'arrays',
  color: '#66d9ef', // light blue
  icon: true,
  faChar: '\uf0ca', // list-ul
  inputs: 1,
  outputs: 1,

  defaults: {
    operation: { type: 'select', default: 'chunk', options: [
      // Slice & Dice
      { value: 'chunk', label: 'Chunk' },
      { value: 'compact', label: 'Compact (remove falsy)' },
      { value: 'concat', label: 'Concat' },
      { value: 'difference', label: 'Difference' },
      { value: 'differenceBy', label: 'Difference By' },
      { value: 'drop', label: 'Drop' },
      { value: 'dropRight', label: 'Drop Right' },
      { value: 'dropWhile', label: 'Drop While' },
      { value: 'dropRightWhile', label: 'Drop Right While' },

      // Fill & Find
      { value: 'fill', label: 'Fill' },
      { value: 'findIndex', label: 'Find Index' },
      { value: 'findLastIndex', label: 'Find Last Index' },

      // Flatten
      { value: 'flatten', label: 'Flatten' },
      { value: 'flattenDeep', label: 'Flatten Deep' },
      { value: 'flattenDepth', label: 'Flatten Depth' },

      // Access
      { value: 'head', label: 'Head (first)' },
      { value: 'last', label: 'Last' },
      { value: 'nth', label: 'Nth' },
      { value: 'initial', label: 'Initial (all but last)' },
      { value: 'tail', label: 'Tail (all but first)' },

      // Index
      { value: 'indexOf', label: 'Index Of' },
      { value: 'lastIndexOf', label: 'Last Index Of' },
      { value: 'sortedIndex', label: 'Sorted Index' },
      { value: 'sortedIndexBy', label: 'Sorted Index By' },
      { value: 'sortedIndexOf', label: 'Sorted Index Of' },
      { value: 'sortedLastIndex', label: 'Sorted Last Index' },
      { value: 'sortedLastIndexBy', label: 'Sorted Last Index By' },
      { value: 'sortedLastIndexOf', label: 'Sorted Last Index Of' },

      // Set Operations
      { value: 'intersection', label: 'Intersection' },
      { value: 'intersectionBy', label: 'Intersection By' },
      { value: 'union', label: 'Union' },
      { value: 'unionBy', label: 'Union By' },
      { value: 'xor', label: 'XOR (symmetric difference)' },
      { value: 'xorBy', label: 'XOR By' },
      { value: 'without', label: 'Without' },

      // Modify
      { value: 'pull', label: 'Pull (remove value)' },
      { value: 'pullAll', label: 'Pull All' },
      { value: 'pullAllBy', label: 'Pull All By' },
      { value: 'pullAt', label: 'Pull At (indexes)' },

      // Transform
      { value: 'reverse', label: 'Reverse' },
      { value: 'slice', label: 'Slice' },
      { value: 'sortedUniq', label: 'Sorted Uniq' },
      { value: 'uniq', label: 'Unique' },
      { value: 'uniqBy', label: 'Unique By' },

      // Take
      { value: 'take', label: 'Take' },
      { value: 'takeRight', label: 'Take Right' },
      { value: 'takeWhile', label: 'Take While' },
      { value: 'takeRightWhile', label: 'Take Right While' },

      // Zip
      { value: 'zip', label: 'Zip' },
      { value: 'zipObject', label: 'Zip Object' },
      { value: 'zipObjectDeep', label: 'Zip Object Deep' },
      { value: 'unzip', label: 'Unzip' },
      { value: 'fromPairs', label: 'From Pairs' },

      // Join
      { value: 'join', label: 'Join' },

      // Custom/Native
      { value: 'length', label: 'Length' },
      { value: 'push', label: 'Push' },
      { value: 'pop', label: 'Pop' },
      { value: 'shift', label: 'Shift' },
      { value: 'unshift', label: 'Unshift' },
      { value: 'splice', label: 'Splice' }
    ]},
    arg1: { type: 'string', default: '', label: 'Argument 1' },
    arg2: { type: 'string', default: '', label: 'Argument 2' },
    arg3: { type: 'string', default: '', label: 'Argument 3' }
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
        <p>Performs array manipulation using lodash functions. Non-array inputs are wrapped in an array.</p>

        <h5>Slice & Dice</h5>
        <ul>
          <li><strong>Chunk</strong>: Split into groups of arg1 size</li>
          <li><strong>Compact</strong>: Remove falsy values (false, null, 0, "", undefined, NaN)</li>
          <li><strong>Drop/Take</strong>: Remove/keep first/last N elements</li>
          <li><strong>Slice</strong>: arg1 = start, arg2 = end</li>
        </ul>

        <h5>Set Operations</h5>
        <ul>
          <li><strong>Difference</strong>: Elements in array but not in arg1</li>
          <li><strong>Intersection</strong>: Elements in both array and arg1</li>
          <li><strong>Union</strong>: Unique elements from both arrays</li>
          <li><strong>XOR</strong>: Elements in one but not both</li>
          <li><strong>Without</strong>: Remove specific values (arg1 as JSON array)</li>
        </ul>

        <h5>Access</h5>
        <ul>
          <li><strong>Head/Last</strong>: Get first/last element</li>
          <li><strong>Nth</strong>: Get element at index (negative = from end)</li>
          <li><strong>Initial/Tail</strong>: All but last/first</li>
        </ul>

        <h5>Transform</h5>
        <ul>
          <li><strong>Flatten</strong>: Flatten nested arrays (Deep = fully recursive)</li>
          <li><strong>Unique</strong>: Remove duplicates</li>
          <li><strong>Reverse</strong>: Reverse order</li>
          <li><strong>Join</strong>: Convert to string with arg1 separator</li>
        </ul>

        <h5>Zip</h5>
        <ul>
          <li><strong>Zip</strong>: Combine arrays by index</li>
          <li><strong>Unzip</strong>: Opposite of zip</li>
          <li><strong>From Pairs</strong>: [[key, val], ...] → object</li>
        </ul>

        <h5>Arguments can be overridden via msg.arg1, msg.arg2, msg.arg3</h5>
        <p>Use JSON for array/object arguments: <code>[1, 2, 3]</code> or <code>{`{"key": "value"}`}</code></p>
      </>
    );
  }
};
