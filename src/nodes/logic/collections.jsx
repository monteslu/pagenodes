export const collectionsNode = {
  type: 'collections',
  category: 'logic',
  description: 'Works with arrays/objects using lodash',
  label: (node) => node.name || 'collections',
  color: '#66d9ef', // light blue
  icon: true,
  faChar: '\uf1b3', // cubes
  inputs: 1,
  outputs: 1,

  defaults: {
    operation: { type: 'select', default: 'countBy', options: [
      // Iteration (work on arrays AND objects)
      { value: 'countBy', label: 'Count By' },
      { value: 'every', label: 'Every' },
      { value: 'filter', label: 'Filter' },
      { value: 'find', label: 'Find' },
      { value: 'findLast', label: 'Find Last' },
      { value: 'flatMap', label: 'Flat Map' },
      { value: 'flatMapDeep', label: 'Flat Map Deep' },
      { value: 'forEach', label: 'For Each' },
      { value: 'forEachRight', label: 'For Each Right' },
      { value: 'groupBy', label: 'Group By' },
      { value: 'includes', label: 'Includes' },
      { value: 'invokeMap', label: 'Invoke Map' },
      { value: 'keyBy', label: 'Key By' },
      { value: 'map', label: 'Map' },
      { value: 'orderBy', label: 'Order By' },
      { value: 'partition', label: 'Partition' },
      { value: 'reduce', label: 'Reduce' },
      { value: 'reduceRight', label: 'Reduce Right' },
      { value: 'reject', label: 'Reject' },
      { value: 'sample', label: 'Sample' },
      { value: 'sampleSize', label: 'Sample Size' },
      { value: 'shuffle', label: 'Shuffle' },
      { value: 'size', label: 'Size' },
      { value: 'some', label: 'Some' },
      { value: 'sortBy', label: 'Sort By' },

      // Object operations
      { value: 'keys', label: 'Keys' },
      { value: 'values', label: 'Values' },
      { value: 'entries', label: 'Entries (toPairs)' },
      { value: 'fromEntries', label: 'From Entries (fromPairs)' },
      { value: 'toPairs', label: 'To Pairs' },
      { value: 'toPairsIn', label: 'To Pairs In' },

      // Merge & Clone
      { value: 'assign', label: 'Assign' },
      { value: 'merge', label: 'Merge (deep)' },
      { value: 'defaults', label: 'Defaults' },
      { value: 'defaultsDeep', label: 'Defaults Deep' },
      { value: 'clone', label: 'Clone' },
      { value: 'cloneDeep', label: 'Clone Deep' },

      // Pick & Omit
      { value: 'pick', label: 'Pick' },
      { value: 'pickBy', label: 'Pick By' },
      { value: 'omit', label: 'Omit' },
      { value: 'omitBy', label: 'Omit By' },

      // Access & Modify
      { value: 'get', label: 'Get' },
      { value: 'set', label: 'Set' },
      { value: 'has', label: 'Has' },
      { value: 'hasIn', label: 'Has In' },
      { value: 'unset', label: 'Unset' },

      // Transform
      { value: 'invert', label: 'Invert' },
      { value: 'invertBy', label: 'Invert By' },
      { value: 'mapKeys', label: 'Map Keys' },
      { value: 'mapValues', label: 'Map Values' },
      { value: 'findKey', label: 'Find Key' },
      { value: 'findLastKey', label: 'Find Last Key' },

      // Query
      { value: 'isEmpty', label: 'Is Empty' }
    ]},
    arg1: { type: 'string', default: '', label: 'Argument 1' },
    arg2: { type: 'string', default: '', label: 'Argument 2' },
    arg3: { type: 'string', default: '', label: 'Argument 3' }
  },

  renderHelp() {
    return (
      <>
        <p>Works with collections (arrays and objects) using lodash functions.</p>

        <h5>Iteration (works on arrays AND objects)</h5>
        <ul>
          <li><strong>Filter/Reject</strong>: Keep/remove elements matching predicate</li>
          <li><strong>Find</strong>: Get first matching element</li>
          <li><strong>Map</strong>: Transform each element</li>
          <li><strong>Reduce</strong>: Accumulate to single value</li>
          <li><strong>Every/Some</strong>: Test if all/any match predicate</li>
          <li><strong>Group By</strong>: Group elements by key</li>
          <li><strong>Sort By/Order By</strong>: Sort by key(s)</li>
          <li><strong>Count By</strong>: Count elements by key</li>
          <li><strong>Partition</strong>: Split into [matches, non-matches]</li>
        </ul>

        <h5>Object Operations</h5>
        <ul>
          <li><strong>Keys/Values/Entries</strong>: Extract keys, values, or [key, value] pairs</li>
          <li><strong>Pick/Omit</strong>: Select or exclude properties (comma-separated)</li>
          <li><strong>Get/Set/Has</strong>: Access nested paths like "user.address.city"</li>
          <li><strong>Assign/Merge</strong>: Combine objects (merge is deep)</li>
          <li><strong>Clone/Clone Deep</strong>: Copy objects</li>
          <li><strong>Invert</strong>: Swap keys and values</li>
        </ul>

        <h5>Predicates</h5>
        <p>For Filter, Find, Reject, Every, Some, use:</p>
        <ul>
          <li>Property shorthand: <code>"active"</code> → items where .active is truthy</li>
          <li>Matches: <code>{`{"type": "admin"}`}</code> → items matching all properties</li>
          <li>MatchesProperty: <code>["type", "admin"]</code> → items where .type === "admin"</li>
        </ul>

        <h5>Sample/Shuffle</h5>
        <ul>
          <li><strong>Sample</strong>: Random element</li>
          <li><strong>Sample Size</strong>: N random elements</li>
          <li><strong>Shuffle</strong>: Randomize order</li>
        </ul>

        <h5>Arguments can be overridden via msg.arg1, msg.arg2, msg.arg3</h5>
      </>
    );
  }
};
