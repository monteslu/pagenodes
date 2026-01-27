/**
 * Storage Context
 *
 * Provides a storage abstraction that works in both browser and server modes.
 * In browser mode, uses localforage (IndexedDB).
 * In server mode, calls the server via rawr.
 */

import { createContext, useContext } from 'react';

const StorageContext = createContext(null);

export function useStorage() {
  const context = useContext(StorageContext);
  if (!context) {
    throw new Error('useStorage must be used within a StorageProvider');
  }
  return context;
}

export function StorageProvider({ storage, children }) {
  return (
    <StorageContext.Provider value={storage}>
      {children}
    </StorageContext.Provider>
  );
}
