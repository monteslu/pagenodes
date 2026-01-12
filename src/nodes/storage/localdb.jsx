export const localreadNode = {
  type: 'localread',
  category: 'storage',
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

  mainThread: {
    read(peerRef, nodeId, { key, storage }) {
      try {
        const store = storage === 'session' ? sessionStorage : localStorage;
        let value = store.getItem(key);
        if (value) {
          try { value = JSON.parse(value); } catch {}
        }
        peerRef.current.methods.sendResult(nodeId, { payload: value });
      } catch (err) {
        console.error('Storage read error:', err);
      }
    }
  }
};

export const localwriteNode = {
  type: 'localwrite',
  category: 'storage',
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

  mainThread: {
    write(peerRef, nodeId, { key, value, storage }) {
      try {
        const store = storage === 'session' ? sessionStorage : localStorage;
        const data = typeof value === 'string' ? value : JSON.stringify(value);
        store.setItem(key, data);
        peerRef.current.methods.sendResult(nodeId, { payload: value });
      } catch (err) {
        console.error('Storage write error:', err);
      }
    }
  }
};
