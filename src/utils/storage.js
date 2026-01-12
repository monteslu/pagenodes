import localforage from 'localforage';

const store = localforage.createInstance({
  name: 'pagenodes2',
  storeName: 'flows'
});

export const storage = {
  async getFlows() {
    return store.getItem('flows');
  },

  async saveFlows(flowConfig) {
    await store.setItem('flows', flowConfig);
  },

  async getCredentials() {
    return (await store.getItem('credentials')) || {};
  },

  async saveCredentials(creds) {
    await store.setItem('credentials', creds);
  }
};
