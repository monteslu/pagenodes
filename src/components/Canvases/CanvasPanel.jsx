import { useEffect, useRef, useCallback } from 'react';
import { useCanvases } from '../../context/CanvasContext';
import { logger } from '../../utils/logger';
import './CanvasPanel.css';

export function CanvasPanel() {
  const { canvases, setCanvasRef } = useCanvases();

  const canvasList = Object.values(canvases);

  return (
    <div className="canvas-panel">
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

// SVG icons as components
const DownloadIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const ExpandIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 3 21 3 21 9" />
    <polyline points="9 21 3 21 3 15" />
    <line x1="21" y1="3" x2="14" y2="10" />
    <line x1="3" y1="21" x2="10" y2="14" />
  </svg>
);

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

  const handleDownload = useCallback(() => {
    if (!canvasRef.current) return;

    // Get the canvas data as PNG
    const dataUrl = canvasRef.current.toDataURL('image/png');

    // Create a download link
    const link = document.createElement('a');
    link.download = `${config.name || 'canvas'}-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  }, [config.name]);

  const handleFullscreen = useCallback(() => {
    if (!canvasRef.current) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      canvasRef.current.requestFullscreen().catch(err => {
        logger.error( 'Fullscreen error:', err);
      });
    }
  }, []);

  return (
    <div className="canvas-item">
      <div className="canvas-item-header">
        <div className="canvas-item-info">
          {config.name && <span className="canvas-name">{config.name}</span>}
          <span className="canvas-size">{config.width} × {config.height}</span>
        </div>
        <div className="canvas-item-actions">
          <button
            className="canvas-action-btn"
            onClick={handleDownload}
            title="Download as PNG"
          >
            <DownloadIcon />
          </button>
          <button
            className="canvas-action-btn"
            onClick={handleFullscreen}
            title="Fullscreen"
          >
            <ExpandIcon />
          </button>
        </div>
      </div>
      <div className="canvas-item-wrapper">
        <canvas
          ref={canvasRef}
          width={config.width}
          height={config.height}
          style={{ background: config.background || '#ffffff' }}
          onDoubleClick={handleDownload}
          title="Double-click to save as PNG"
        />
      </div>
    </div>
  );
}
