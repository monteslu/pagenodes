import localforage from 'localforage';

const store = localforage.createInstance({
  name: 'pagenodes2',
  storeName: 'flows'
});

const DEFAULT_SETTINGS = {
  mcpEnabled: false,
  mcpPort: 7778
};

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
  },

  async getSettings() {
    const settings = await store.getItem('settings');
    return { ...DEFAULT_SETTINGS, ...settings };
  },

  async saveSettings(settings) {
    await store.setItem('settings', settings);
  }
};
