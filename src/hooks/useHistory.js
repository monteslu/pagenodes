import { useCallback, useRef, useState, useMemo } from 'react';

const MAX_HISTORY = 50;

export function useHistory(initialState) {
  const [state, setState] = useState(initialState);
  const [position, setPosition] = useState(0);
  const [historyLength, setHistoryLength] = useState(1);
  const history = useRef([initialState]);
  const isUndoRedo = useRef(false);

  const pushState = useCallback((newState) => {
    // Don't record if this is an undo/redo operation
    if (isUndoRedo.current) {
      isUndoRedo.current = false;
      return;
    }

    setPosition(pos => {
      // Remove any future states if we're not at the end
      history.current = history.current.slice(0, pos + 1);

      // Add new state
      history.current.push(newState);

      // Limit history size
      if (history.current.length > MAX_HISTORY) {
        history.current.shift();
        setHistoryLength(history.current.length);
        return pos;
      } else {
        setHistoryLength(history.current.length);
        return pos + 1;
      }
    });
  }, []);

  const undo = useCallback(() => {
    setPosition(pos => {
      if (pos > 0) {
        const newPos = pos - 1;
        isUndoRedo.current = true;
        const prevState = history.current[newPos];
        setState(prevState);
        return newPos;
      }
      return pos;
    });
  }, []);

  const redo = useCallback(() => {
    setPosition(pos => {
      if (pos < history.current.length - 1) {
        const newPos = pos + 1;
        isUndoRedo.current = true;
        const nextState = history.current[newPos];
        setState(nextState);
        return newPos;
      }
      return pos;
    });
  }, []);

  const canUndo = position > 0;
  const canRedo = position < historyLength - 1;

  const setStateWithHistory = useMemo(() => (newState) => {
    setState(newState);
    pushState(newState);
  }, [pushState]);

  return {
    state,
    setState: setStateWithHistory,
    undo,
    redo,
    canUndo,
    canRedo
  };
}
