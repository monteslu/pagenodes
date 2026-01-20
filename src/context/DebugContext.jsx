import { createContext, useContext, useReducer, useCallback, useMemo } from 'react';
import { generateId } from '../utils/id';

const MAX_MESSAGES = 100;
const MAX_DOWNLOADS = 100;
const MAX_ERRORS = 100;

const initialState = {
  messages: [],
  downloads: [],
  errors: [],
  enabled: true
};

function debugReducer(state, action) {
  switch (action.type) {
    case 'ADD_MESSAGE': {
      const messages = [
        { id: generateId(), ...action.message, timestamp: Date.now() },
        ...state.messages
      ].slice(0, MAX_MESSAGES);
      return { ...state, messages };
    }

    case 'ADD_DOWNLOAD': {
      // Revoke oldest blob URLs if we're at the limit
      const toRevoke = state.downloads.slice(MAX_DOWNLOADS - 1);
      toRevoke.forEach(d => {
        if (d.blobUrl) URL.revokeObjectURL(d.blobUrl);
      });

      const downloads = [
        { id: generateId(), ...action.download, timestamp: Date.now() },
        ...state.downloads
      ].slice(0, MAX_DOWNLOADS);
      return { ...state, downloads };
    }

    case 'REMOVE_DOWNLOAD': {
      const download = state.downloads.find(d => d.id === action.id);
      if (download?.blobUrl) {
        URL.revokeObjectURL(download.blobUrl);
      }
      return {
        ...state,
        downloads: state.downloads.filter(d => d.id !== action.id)
      };
    }

    case 'ADD_ERROR': {
      const errors = [
        { id: generateId(), ...action.error, timestamp: Date.now() },
        ...state.errors
      ].slice(0, MAX_ERRORS);
      return { ...state, errors };
    }

    case 'CLEAR':
      return { ...state, messages: [] };

    case 'CLEAR_ERRORS':
      return { ...state, errors: [] };

    case 'CLEAR_DOWNLOADS':
      // Revoke all blob URLs
      state.downloads.forEach(d => {
        if (d.blobUrl) URL.revokeObjectURL(d.blobUrl);
      });
      return { ...state, downloads: [] };

    case 'TOGGLE':
      return { ...state, enabled: !state.enabled };

    default:
      return state;
  }
}

const DebugContext = createContext(null);

export function DebugProvider({ children }) {
  const [state, dispatch] = useReducer(debugReducer, initialState);

  const addMessage = useCallback((nodeId, nodeName, payload, topic, _msgid) => {
    dispatch({
      type: 'ADD_MESSAGE',
      message: { nodeId, nodeName, payload, topic, _msgid }
    });
  }, []);

  const addDownload = useCallback((nodeId, nodeName, filename, blobUrl, size) => {
    dispatch({
      type: 'ADD_DOWNLOAD',
      download: { nodeId, nodeName, filename, blobUrl, size }
    });
  }, []);

  const removeDownload = useCallback((id) => {
    dispatch({ type: 'REMOVE_DOWNLOAD', id });
  }, []);

  const addError = useCallback((nodeId, nodeName, nodeType, message, stack, _msgid) => {
    dispatch({
      type: 'ADD_ERROR',
      error: { nodeId, nodeName, nodeType, message, stack, _msgid }
    });
  }, []);

  const clear = useCallback(() => {
    dispatch({ type: 'CLEAR' });
  }, []);

  const clearErrors = useCallback(() => {
    dispatch({ type: 'CLEAR_ERRORS' });
  }, []);

  const clearDownloads = useCallback(() => {
    dispatch({ type: 'CLEAR_DOWNLOADS' });
  }, []);

  const toggle = useCallback(() => {
    dispatch({ type: 'TOGGLE' });
  }, []);

  const value = useMemo(() => ({
    messages: state.messages,
    downloads: state.downloads,
    errors: state.errors,
    enabled: state.enabled,
    addMessage,
    addDownload,
    removeDownload,
    addError,
    clear,
    clearErrors,
    clearDownloads,
    toggle
  }), [state.messages, state.downloads, state.errors, state.enabled, addMessage, addDownload, removeDownload, addError, clear, clearErrors, clearDownloads, toggle]);

  return (
    <DebugContext.Provider value={value}>
      {children}
    </DebugContext.Provider>
  );
}

export function useDebug() {
  const context = useContext(DebugContext);
  if (!context) throw new Error('useDebug must be used within DebugProvider');
  return context;
}
