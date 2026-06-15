import { useCallback, useEffect, useRef } from 'react';
import { useEditor } from '../context/EditorContext';

export function useCanvas(svgRef) {
  const { state: editor, dispatch } = useEditor();

  // When zooming via pinch/wheel, remember the point to keep anchored under the
  // cursor so the zoom grows from where the user pinched, not the canvas origin.
  const zoomFocus = useRef(null);

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

  // Handle Ctrl/Cmd+wheel for zoom (trackpad pinch arrives as ctrl+wheel)
  const handleWheel = useCallback((e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const container = svgRef.current?.parentElement;
      const newZoom = Math.max(0.25, Math.min(2, editor.zoom * (e.deltaY > 0 ? 0.9 : 1.1)));
      if (newZoom === editor.zoom) return;

      if (container) {
        const rect = container.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const offsetY = e.clientY - rect.top;
        // Canvas-space point currently under the cursor (zoom-independent)
        zoomFocus.current = {
          canvasX: (container.scrollLeft + offsetX) / editor.zoom,
          canvasY: (container.scrollTop + offsetY) / editor.zoom,
          offsetX,
          offsetY
        };
      }
      dispatch({ type: 'SET_ZOOM', zoom: newZoom });
    }
    // Let native scroll handle non-Ctrl wheel
  }, [svgRef, editor.zoom, dispatch]);

  // After the zoom (and the resized canvas) is applied, re-anchor the focal
  // point under the cursor by adjusting scroll.
  useEffect(() => {
    const focus = zoomFocus.current;
    zoomFocus.current = null;
    if (!focus) return;
    const container = svgRef.current?.parentElement;
    if (!container) return;
    container.scrollTo({
      left: focus.canvasX * editor.zoom - focus.offsetX,
      top: focus.canvasY * editor.zoom - focus.offsetY,
      behavior: 'auto'
    });
  }, [editor.zoom, svgRef]);

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
