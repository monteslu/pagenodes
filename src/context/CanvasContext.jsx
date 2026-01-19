import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { canvasManager } from '../utils/canvasManager';

const CanvasContext = createContext(null);

export function CanvasProvider({ children }) {
  const [canvases, setCanvases] = useState({});

  // Subscribe to canvas manager changes
  useEffect(() => {
    const unsubscribe = canvasManager.subscribe((newCanvases) => {
      setCanvases({ ...newCanvases });
    });

    // Initialize with current state
    setCanvases(canvasManager.getCanvases());

    return unsubscribe;
  }, []);

  // Store ref to actual canvas element
  const setCanvasRef = useCallback((configId, canvasElement) => {
    canvasManager.setCanvasRef(configId, canvasElement);
  }, []);

  const value = {
    canvases,
    setCanvasRef
  };

  return (
    <CanvasContext.Provider value={value}>
      {children}
    </CanvasContext.Provider>
  );
}

export function useCanvases() {
  const context = useContext(CanvasContext);
  if (!context) {
    throw new Error('useCanvases must be used within CanvasProvider');
  }
  return context;
}
