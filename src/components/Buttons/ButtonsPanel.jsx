import { useState, useCallback, useEffect } from 'react';
import { useRuntime } from '../../context/RuntimeContext';
import './ButtonsPanel.css';

// Phone dial layout: 1-9, *, 0, #
// Each button has a distinctly different color
const BUTTONS = [
  { label: '1', color: '#E74C3C' },  // bright red
  { label: '2', color: '#3498DB' },  // bright blue
  { label: '3', color: '#2ECC71' },  // emerald green
  { label: '4', color: '#F39C12' },  // orange
  { label: '5', color: '#9B59B6' },  // purple
  { label: '6', color: '#1ABC9C' },  // turquoise
  { label: '7', color: '#E91E63' },  // pink
  { label: '8', color: '#00BCD4' },  // cyan
  { label: '9', color: '#8BC34A' },  // lime green
  { label: '*', color: '#FF5722' },  // deep orange
  { label: '0', color: '#673AB7' },  // deep purple
  { label: '#', color: '#009688' },  // teal
];

export function ButtonsPanel() {
  const { broadcastToType, isRunning } = useRuntime();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeButton, setActiveButton] = useState(null);

  const handleButtonPress = useCallback((button) => {
    if (!isRunning) return;

    setActiveButton(button);
    broadcastToType('buttons', 'buttonPress', { button });

    // Visual feedback
    setTimeout(() => setActiveButton(null), 150);
  }, [broadcastToType, isRunning]);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  const exitFullscreen = useCallback(() => {
    setIsFullscreen(false);
  }, []);

  // Escape key exits fullscreen
  useEffect(() => {
    if (!isFullscreen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsFullscreen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  const panelContent = (
    <>
      <div className="buttons-grid">
        {BUTTONS.map(({ label, color }) => (
          <button
            key={label}
            className={`dial-button ${activeButton === label ? 'active' : ''}`}
            style={{ '--button-color': color }}
            onClick={() => handleButtonPress(label)}
            disabled={!isRunning}
          >
            {label}
          </button>
        ))}
      </div>
      {!isRunning && (
        <div className="buttons-disabled-msg">
          Deploy to enable buttons
        </div>
      )}
    </>
  );

  if (isFullscreen) {
    return (
      <div className="buttons-fullscreen">
        <button className="buttons-exit-fullscreen" onClick={exitFullscreen} title="Exit fullscreen">
          {'\uf066'}
        </button>
        <div className="buttons-fullscreen-content">
          {panelContent}
        </div>
      </div>
    );
  }

  return (
    <div className="buttons-panel">
      <div className="buttons-header">
        <h3>Buttons</h3>
        <button
          className="buttons-fullscreen-btn"
          onClick={toggleFullscreen}
          title="Fullscreen mode"
        >
          {'\uf065'}
        </button>
      </div>
      <div className="buttons-content">
        {panelContent}
      </div>
    </div>
  );
}
