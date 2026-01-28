/**
 * Shared Runtime Context
 *
 * This module provides the RuntimeContext and useRuntime hook.
 * The actual provider implementation is in RuntimeContext.jsx (worker)
 * or ServerRuntimeProvider.jsx (websocket).
 */

import { createContext, useContext } from 'react';

export const RuntimeContext = createContext(null);

export function useRuntime() {
  const context = useContext(RuntimeContext);
  if (!context) {
    throw new Error('useRuntime must be used within RuntimeProvider');
  }
  return context;
}
