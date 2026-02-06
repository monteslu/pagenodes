import { useCallback, useState, useEffect, useRef } from 'react';
import './WhatsNewDialog.css';

// Get version from Vite define or fallback
const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '2.0.0';
const LAST_SEEN_VERSION_KEY = 'pagenodes2_last_seen_version';

// Changelog content - update this with each release
const CHANGELOG = {
  '2.0.0': {
    title: 'PageNodes 2.0 - Complete Rewrite!',
    date: '2026-02-06',
    sections: [
      {
        title: '🎉 What\'s New',
        items: [
          '**React + Vite** - Modern, fast development experience',
          '**On-Device AI** - Text generation, image classification, object detection with Transformers.js and MediaPipe',
          '**Full Web Audio API** - Visual audio stream wiring with 20+ audio nodes',
          '**MCP Integration** - Let Claude AI edit and deploy your flows',
          '**Hardware Access** - Camera, Serial, Bluetooth, USB, Gamepad, MIDI, and more',
          '**Multi-Track Stems** - Play and control Native Instruments Stems format',
          '**hsync Networking** - Peer-to-peer communication without servers',
          '**Canvas Nodes** - Draw graphics and create interactive visualizations',
          '**Improved UI** - Resizable sidebar, better touch support, dark theme'
        ]
      },
      {
        title: '🔧 Improvements',
        items: [
          'Complete architecture rewrite for better performance',
          'Simplified node registration system',
          'Better error handling throughout',
          'WebSocket errors now properly surfaced'
        ]
      }
    ]
  }
};

export function useWhatsNew() {
  // Initialize state based on localStorage (only runs once on mount)
  const [showWhatsNew, setShowWhatsNew] = useState(() => {
    const lastSeen = localStorage.getItem(LAST_SEEN_VERSION_KEY);
    return lastSeen !== APP_VERSION;
  });

  const dismissWhatsNew = useCallback(() => {
    localStorage.setItem(LAST_SEEN_VERSION_KEY, APP_VERSION);
    setShowWhatsNew(false);
  }, []);

  const openWhatsNew = useCallback(() => {
    setShowWhatsNew(true);
  }, []);

  return { showWhatsNew, dismissWhatsNew, openWhatsNew, version: APP_VERSION };
}

export function WhatsNewDialog({ onClose }) {
  const versionData = CHANGELOG[APP_VERSION] || CHANGELOG[Object.keys(CHANGELOG)[0]];
  const overlayRef = useRef(null);

  // Handle escape key via document listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Auto-focus overlay for accessibility
  useEffect(() => {
    if (overlayRef.current) {
      overlayRef.current.focus();
    }
  }, []);

  const handleOverlayClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  const handleClose = useCallback(() => {
    localStorage.setItem(LAST_SEEN_VERSION_KEY, APP_VERSION);
    onClose();
  }, [onClose]);

  // Simple markdown-like bold parsing
  const renderText = (text) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div 
      className="whatsnew-dialog-overlay" 
      onClick={handleOverlayClick}
      ref={overlayRef}
      tabIndex={-1}
    >
      <div className="whatsnew-dialog">
        <div className="whatsnew-dialog-header">
          <span className="whatsnew-dialog-title">What&apos;s New in v{APP_VERSION}</span>
          <button className="whatsnew-dialog-close" onClick={handleClose}>&times;</button>
        </div>

        <div className="whatsnew-dialog-content">
          <h2 className="whatsnew-main-title">{versionData.title}</h2>
          <p className="whatsnew-date">{versionData.date}</p>

          {versionData.sections.map((section, idx) => (
            <div key={idx} className="whatsnew-section">
              <h3 className="whatsnew-section-title">{section.title}</h3>
              <ul className="whatsnew-list">
                {section.items.map((item, itemIdx) => (
                  <li key={itemIdx}>{renderText(item)}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="whatsnew-dialog-footer">
          <a 
            href="https://github.com/monteslu/pagenodes/blob/master/CHANGELOG.md" 
            target="_blank" 
            rel="noopener noreferrer"
            className="whatsnew-link"
          >
            View Full Changelog
          </a>
          <button className="btn btn-primary" onClick={handleClose}>
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}
