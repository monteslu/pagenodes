/**
 * Server Storage
 *
 * File-based storage for Node.js server mode.
 * Stores flows, credentials, and settings as JSON files.
 */

import fs from 'fs/promises';
import path from 'path';
import os from 'os';

// Default storage directory - ~/.pagenodes or override via environment variable
const STORAGE_DIR = process.env.PAGENODES_STORAGE_DIR || path.join(os.homedir(), '.pagenodes');

const DEFAULT_SETTINGS = {
  mcpEnabled: false,
  mcpPort: 7778
};

async function ensureDir() {
  try {
    await fs.mkdir(STORAGE_DIR, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }
}

async function readJSON(filename) {
  try {
    const filepath = path.join(STORAGE_DIR, filename);
    const data = await fs.readFile(filepath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
}

async function writeJSON(filename, data) {
  await ensureDir();
  const filepath = path.join(STORAGE_DIR, filename);
  await fs.writeFile(filepath, JSON.stringify(data, null, 2), 'utf8');
}

export const storage = {
  async getFlows() {
    return readJSON('flows.json');
  },

  async saveFlows(flowConfig) {
    await writeJSON('flows.json', flowConfig);
  },

  async getCredentials() {
    return (await readJSON('credentials.json')) || {};
  },

  async saveCredentials(creds) {
    await writeJSON('credentials.json', creds);
  },

  async getSettings() {
    const settings = await readJSON('settings.json');
    return { ...DEFAULT_SETTINGS, ...settings };
  },

  async saveSettings(settings) {
    await writeJSON('settings.json', settings);
  }
};
