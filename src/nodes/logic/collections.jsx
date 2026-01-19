export const collectionsNode = {
  type: 'collections',
  category: 'logic',
  description: 'Works with arrays/objects - sort, filter, etc',
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
  },

  renderHelp() {
    return (
      <>
        <p>Performs object/collection manipulation operations on <code>msg.payload</code>.</p>

        <h5>Operations</h5>
        <ul>
          <li><strong>Extraction</strong>: Keys, Values, Entries, From Entries</li>
          <li><strong>Access</strong>: Get Property, Set Property, Has Property, Delete Property</li>
          <li><strong>Selection</strong>: Pick (keep only specified keys), Omit (remove specified keys)</li>
          <li><strong>Transform</strong>: Assign/Merge, Clone, Clone Deep, Freeze, Invert</li>
          <li><strong>Iteration</strong>: Map Keys, Map Values, Group By, Sort By</li>
          <li><strong>Query</strong>: Size, Is Empty</li>
        </ul>

        <h5>Arguments</h5>
        <ul>
          <li><strong>Get/Set/Has/Delete</strong>: arg1 = property path (e.g., "user.name")</li>
          <li><strong>Pick/Omit</strong>: arg1 = comma-separated keys</li>
          <li><strong>Group By/Sort By</strong>: arg1 = key to group/sort by</li>
        </ul>

        <h5>Example</h5>
        <p>Extract only needed fields from API response:</p>
        <pre>{`Pick with arg1 = "id,name,email"`}</pre>
      </>
    );
  }
};
