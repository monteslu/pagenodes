import { useCallback, useEffect } from 'react';
import { useEditor } from '../context/EditorContext';

export function useCanvas(svgRef) {
  const { state: editor, dispatch } = useEditor();

  // Convert screen coordinates to canvas coordinates (accounting for zoom)
  const screenToCanvas = useCallback((screenX, screenY) => {
    const svg = svgRef.current;
    if (!svg) return { x: screenX, y: screenY };

    // getBoundingClientRect already accounts for scroll position
    const rect = svg.getBoundingClientRect();

    return {
      x: (screenX - rect.left) / editor.zoom,
      y: (screenY - rect.top) / editor.zoom
    };
  }, [svgRef, editor.zoom]);

  // Handle Ctrl+wheel for zoom
  const handleWheel = useCallback((e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(0.25, Math.min(2, editor.zoom * delta));
      dispatch({ type: 'SET_ZOOM', zoom: newZoom });
    }
    // Let native scroll handle non-Ctrl wheel
  }, [editor.zoom, dispatch]);

  // Set up wheel listener
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const container = svg.parentElement;
    if (!container) return;

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [svgRef, handleWheel]);

  return {
    screenToCanvas,
    handlers: {
      onMouseDown: () => {},
      onMouseMove: () => {},
      onMouseUp: () => {},
      onMouseLeave: () => {}
    }
  };
}
