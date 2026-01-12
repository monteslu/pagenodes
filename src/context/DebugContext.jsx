import { createContext, useContext, useReducer, useCallback, useMemo } from 'react';
import { generateId } from '../utils/id';

const MAX_MESSAGES = 100;

const initialState = {
  messages: [],
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

    case 'CLEAR':
      return { ...state, messages: [] };

    case 'TOGGLE':
      return { ...state, enabled: !state.enabled };

    default:
      return state;
  }
}

const DebugContext = createContext(null);

export function DebugProvider({ children }) {
  const [state, dispatch] = useReducer(debugReducer, initialState);

  const addMessage = useCallback((nodeId, nodeName, payload, topic) => {
    dispatch({
      type: 'ADD_MESSAGE',
      message: { nodeId, nodeName, payload, topic }
    });
  }, []);

  const clear = useCallback(() => {
    dispatch({ type: 'CLEAR' });
  }, []);

  const toggle = useCallback(() => {
    dispatch({ type: 'TOGGLE' });
  }, []);

  const value = useMemo(() => ({
    messages: state.messages,
    enabled: state.enabled,
    addMessage,
    clear,
    toggle
  }), [state.messages, state.enabled, addMessage, clear, toggle]);

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
