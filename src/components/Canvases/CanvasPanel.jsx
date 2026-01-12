import { useEffect, useRef, useCallback } from 'react';
import { useCanvases } from '../../context/CanvasContext';
import './CanvasPanel.css';

export function CanvasPanel() {
  const { canvases, setCanvasRef } = useCanvases();

  const canvasList = Object.values(canvases);

  return (
    <div className="canvas-panel">
      <div className="canvas-panel-header">
        <h3>Canvases</h3>
        <span className="canvas-count">{canvasList.length}</span>
      </div>

      <div className="canvas-panel-content">
        {canvasList.length === 0 ? (
          <div className="canvas-empty">
            No canvases yet.
            <br />
            <span className="hint">Add a canvas node and deploy</span>
          </div>
        ) : (
          canvasList.map((config) => (
            <CanvasItem
              key={config.id}
              config={config}
              setCanvasRef={setCanvasRef}
            />
          ))
        )}
      </div>
    </div>
  );
}

function CanvasItem({ config, setCanvasRef }) {
  const canvasRef = useRef(null);
  const initializedRef = useRef(false);

  // Register canvas ref
  useEffect(() => {
    if (canvasRef.current) {
      setCanvasRef(config.id, canvasRef.current);
    }
    return () => {
      setCanvasRef(config.id, null);
    };
  }, [config.id, setCanvasRef]);

  // Initialize background only once on mount
  useEffect(() => {
    if (canvasRef.current && !initializedRef.current) {
      initializedRef.current = true;
      const ctx = canvasRef.current.getContext('2d');
      ctx.fillStyle = config.background || '#ffffff';
      ctx.fillRect(0, 0, config.width, config.height);
    }
  }, [config.width, config.height, config.background]);

  const handleDoubleClick = useCallback(() => {
    if (!canvasRef.current) return;

    // Get the canvas data as PNG
    const dataUrl = canvasRef.current.toDataURL('image/png');

    // Create a download link
    const link = document.createElement('a');
    link.download = `${config.name || 'canvas'}-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  }, [config.name]);

  return (
    <div className="canvas-item">
      <div className="canvas-item-header">
        <span className="canvas-name">{config.name || 'Canvas'}</span>
        <span className="canvas-size">{config.width} x {config.height}</span>
      </div>
      <div className="canvas-item-wrapper">
        <canvas
          ref={canvasRef}
          width={config.width}
          height={config.height}
          style={{ background: config.background || '#ffffff' }}
          onDoubleClick={handleDoubleClick}
          title="Double-click to save as PNG"
        />
      </div>
    </div>
  );
}
