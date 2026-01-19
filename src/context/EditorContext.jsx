import { createContext, useContext, useReducer } from 'react';

const initialState = {
  selectedNodes: [],
  mode: 'select', // 'select' | 'connect' | 'pan'
  zoom: 1,
  pan: { x: 0, y: 0 },
  activeFlow: '',
  dirty: false,
  clipboard: null,
  connecting: null, // { sourceId, sourcePort } when drawing a wire
  pendingWires: new Set(), // wire IDs that haven't been deployed yet
  pendingNodes: new Set(), // node IDs that haven't been deployed yet
  nodeErrors: new Map(), // node ID -> array of error messages
  scrollTarget: null // { x, y } - canvas coordinates to scroll to
};

function editorReducer(state, action) {
  switch (action.type) {
    case 'SELECT_NODE':
      if (action.additive) {
        const isSelected = state.selectedNodes.includes(action.id);
        return {
          ...state,
          selectedNodes: isSelected
            ? state.selectedNodes.filter(id => id !== action.id)
            : [...state.selectedNodes, action.id]
        };
      }
      return { ...state, selectedNodes: [action.id] };

    case 'SELECT_NODES':
      return { ...state, selectedNodes: action.ids };

    case 'DESELECT_ALL':
      return { ...state, selectedNodes: [] };

    case 'SET_MODE':
      return { ...state, mode: action.mode };

    case 'SET_ZOOM':
      return { ...state, zoom: Math.max(0.25, Math.min(2, action.zoom)) };

    case 'SET_PAN':
      return { ...state, pan: action.pan };

    case 'SET_ACTIVE_FLOW':
      return { ...state, activeFlow: action.id, selectedNodes: [] };

    case 'MARK_DIRTY':
      return { ...state, dirty: true };

    case 'MARK_CLEAN':
      return { ...state, dirty: false, pendingWires: new Set(), pendingNodes: new Set() };

    case 'ADD_PENDING_WIRE': {
      const newPendingWires = new Set(state.pendingWires);
      newPendingWires.add(action.wireId);
      return { ...state, pendingWires: newPendingWires };
    }

    case 'ADD_PENDING_NODE': {
      const newPendingNodes = new Set(state.pendingNodes);
      newPendingNodes.add(action.nodeId);
      return { ...state, pendingNodes: newPendingNodes };
    }

    case 'ADD_PENDING_NODES': {
      const newPendingNodes = new Set(state.pendingNodes);
      action.nodeIds.forEach(id => newPendingNodes.add(id));
      return { ...state, pendingNodes: newPendingNodes };
    }

    case 'SET_NODE_ERRORS':
      return { ...state, nodeErrors: action.errors };

    case 'START_CONNECTING':
      return { ...state, connecting: { sourceId: action.sourceId, sourcePort: action.sourcePort } };

    case 'STOP_CONNECTING':
      return { ...state, connecting: null };

    case 'SET_CLIPBOARD':
      return { ...state, clipboard: action.nodes };

    case 'SCROLL_TO':
      return { ...state, scrollTarget: { x: action.x, y: action.y, timestamp: Date.now() } };

    case 'CLEAR_SCROLL_TARGET':
      return { ...state, scrollTarget: null };

    default:
      return state;
  }
}

const EditorContext = createContext(null);

export function EditorProvider({ children }) {
  const [state, dispatch] = useReducer(editorReducer, initialState);

  return (
    <EditorContext.Provider value={{ state, dispatch }}>
      {children}
    </EditorContext.Provider>
  );
}

export function useEditor() {
  const context = useContext(EditorContext);
  if (!context) throw new Error('useEditor must be used within EditorProvider');
  return context;
}
