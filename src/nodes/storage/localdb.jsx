export const localreadNode = {
  type: 'localread',
  category: 'storage',
  description: 'Reads from browser local storage',
  label: (node) => node._node.name || 'local read',
  color: '#7E57C2', // purple
  icon: true,
  faChar: '\uf1c0', // database
  faColor: '#fff',
  fontColor: '#fff',
  inputs: 1,
  outputs: 1,

  defaults: {
    key: { type: 'string', default: '' },
    storage: { type: 'select', default: 'local', options: [
      { value: 'local', label: 'localStorage' },
      { value: 'session', label: 'sessionStorage' }
    ]}
  },

  messageInterface: {
    reads: {
      key: {
        type: 'string',
        description: 'Override the configured key',
        optional: true
      }
    },
    writes: {
      payload: {
        type: 'any',
        description: 'Stored value (auto-parsed if JSON)'
      }
    }
  },

  mainThread: {
    read(peerRef, nodeId, { key, storage }, PN) {
      try {
        const store = storage === 'session' ? sessionStorage : localStorage;
        let value = store.getItem(key);
        if (value) {
          try { value = JSON.parse(value); } catch { /* not JSON */ }
        }
        peerRef.current.methods.sendResult(nodeId, { payload: value });
      } catch (err) {
        PN.error('Storage read error:', err);
      }
    }
  },

  renderHelp() {
    return (
      <>
        <p>Reads data from browser storage. Data persists across page reloads and browser sessions.</p>

        <h5>Options</h5>
        <ul>
          <li><strong>Key</strong> - Storage key to read from</li>
          <li><strong>Storage</strong>:
            <ul>
              <li>localStorage - Persists indefinitely</li>
              <li>sessionStorage - Cleared when tab closes</li>
            </ul>
          </li>
        </ul>

        <h5>Input</h5>
        <ul>
          <li>Any message triggers a read</li>
          <li><code>msg.key</code> - Override the configured key</li>
        </ul>

        <h5>Output</h5>
        <ul>
          <li><code>msg.payload</code> - Stored value (auto-parsed if JSON)</li>
        </ul>

        <h5>Note</h5>
        <p>Returns <code>null</code> if key doesn't exist. Storage is limited to ~5-10MB per origin.</p>
      </>
    );
  }
};

export const localwriteNode = {
  type: 'localwrite',
  category: 'storage',
  description: 'Writes to browser local storage',
  label: (node) => node._node.name || 'local write',
  color: '#7E57C2', // purple
  icon: true,
  faChar: '\uf1c0', // database
  faColor: '#fff',
  fontColor: '#fff',
  inputs: 1,
  outputs: 1,

  defaults: {
    key: { type: 'string', default: '' },
    storage: { type: 'select', default: 'local', options: [
      { value: 'local', label: 'localStorage' },
      { value: 'session', label: 'sessionStorage' }
    ]}
  },

  messageInterface: {
    reads: {
      payload: {
        type: 'any',
        description: 'Data to store (objects are JSON stringified)',
        required: true
      },
      key: {
        type: 'string',
        description: 'Override the configured key',
        optional: true
      }
    },
    writes: {
      payload: {
        type: 'any',
        description: 'The stored value (passed through)'
      }
    }
  },

  mainThread: {
    write(peerRef, nodeId, { key, value, storage }, PN) {
      try {
        const store = storage === 'session' ? sessionStorage : localStorage;
        const data = typeof value === 'string' ? value : JSON.stringify(value);
        store.setItem(key, data);
        peerRef.current.methods.sendResult(nodeId, { payload: value });
      } catch (err) {
        PN.error('Storage write error:', err);
      }
    }
  },

  renderHelp() {
    return (
      <>
        <p>Writes data to browser storage. Data persists across page reloads and browser sessions.</p>

        <h5>Options</h5>
        <ul>
          <li><strong>Key</strong> - Storage key to write to</li>
          <li><strong>Storage</strong>:
            <ul>
              <li>localStorage - Persists indefinitely</li>
              <li>sessionStorage - Cleared when tab closes</li>
            </ul>
          </li>
        </ul>

        <h5>Input</h5>
        <ul>
          <li><code>msg.payload</code> - Data to store (objects are JSON stringified)</li>
          <li><code>msg.key</code> - Override the configured key</li>
        </ul>

        <h5>Output</h5>
        <ul>
          <li><code>msg.payload</code> - The stored value (passed through)</li>
        </ul>

        <h5>Use Cases</h5>
        <ul>
          <li>Save user preferences</li>
          <li>Cache API responses</li>
          <li>Store flow state between sessions</li>
        </ul>
      </>
    );
  }
};
