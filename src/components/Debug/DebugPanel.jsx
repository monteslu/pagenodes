import { useState, useEffect } from 'react';
import { useDebug } from '../../context/DebugContext';
import { useRuntime } from '../../context/RuntimeContext';
import './DebugPanel.css';

const PANEL_STATE_KEY = 'pagenodes2_debug_sections';

const DEFAULT_SECTIONS = {
  files: true,
  messages: true
};

export function DebugPanel() {
  const { messages, downloads, enabled, clear, clearDownloads, toggle, removeDownload } = useDebug();
  const { injectText, isRunning } = useRuntime();
  const [inputText, setInputText] = useState('');
  const [sendOnKey, setSendOnKey] = useState(false);

  // Collapsible section state
  const [sections, setSections] = useState(() => {
    try {
      const saved = localStorage.getItem(PANEL_STATE_KEY);
      if (saved) return { ...DEFAULT_SECTIONS, ...JSON.parse(saved) };
    } catch { /* ignore parse errors */ }
    return DEFAULT_SECTIONS;
  });

  // Persist section state
  useEffect(() => {
    localStorage.setItem(PANEL_STATE_KEY, JSON.stringify(sections));
  }, [sections]);

  const toggleSection = (section) => {
    setSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Check if payload is a data URL (image, audio, etc.)
  const isDataUrl = (payload) => {
    return typeof payload === 'string' && payload.startsWith('data:');
  };

  const isImageDataUrl = (payload) => {
    return typeof payload === 'string' && payload.startsWith('data:image/');
  };

  const isAudioDataUrl = (payload) => {
    return typeof payload === 'string' && payload.startsWith('data:audio/');
  };

  const isVideoDataUrl = (payload) => {
    return typeof payload === 'string' && payload.startsWith('data:video/');
  };

  // Check if payload is a regular URL to an image
  const isImageUrl = (payload) => {
    if (typeof payload !== 'string') return false;
    const lower = payload.toLowerCase();
    return (lower.startsWith('http://') || lower.startsWith('https://')) &&
      (lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png') ||
       lower.endsWith('.gif') || lower.endsWith('.webp') || lower.endsWith('.svg'));
  };

  const formatPayload = (payload) => {
    if (payload === undefined) return 'undefined';
    if (payload === null) return 'null';
    if (typeof payload === 'object') {
      try {
        return JSON.stringify(payload, null, 2);
      } catch {
        return String(payload);
      }
    }
    return String(payload);
  };

  const renderPayload = (payload) => {
    // Render images (data URLs or regular URLs)
    if (isImageDataUrl(payload) || isImageUrl(payload)) {
      return (
        <div className="debug-media">
          <img src={payload} alt="debug output" />
        </div>
      );
    }

    // Render audio
    if (isAudioDataUrl(payload)) {
      return (
        <div className="debug-media">
          <audio controls src={payload} />
        </div>
      );
    }

    // Render video
    if (isVideoDataUrl(payload)) {
      return (
        <div className="debug-media">
          <video controls src={payload} />
        </div>
      );
    }

    // Truncate very long data URLs for display
    if (isDataUrl(payload)) {
      const truncated = payload.substring(0, 100) + '... [' + payload.length + ' chars]';
      return <pre className="debug-payload">{truncated}</pre>;
    }

    // Default text rendering
    return <pre className="debug-payload">{formatPayload(payload)}</pre>;
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    });
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleSendText = () => {
    if (inputText && isRunning) {
      injectText(inputText);
      setInputText('');
    }
  };

  const handleKeyUp = (e) => {
    if (e.key === 'Enter' || sendOnKey) {
      handleSendText();
    }
  };

  const handleDownloadClick = (download) => {
    const a = document.createElement('a');
    a.href = download.blobUrl;
    a.download = download.filename;
    a.click();
  };

  return (
    <div className="debug-panel">
      <div className="debug-header">
        <h3>Debug</h3>
        <div className="debug-controls">
          <button
            className={`debug-toggle ${enabled ? 'active' : ''}`}
            onClick={toggle}
            title={enabled ? 'Disable debug output' : 'Enable debug output'}
          >
            {enabled ? 'On' : 'Off'}
          </button>
          <button
            className="debug-clear"
            onClick={() => { clear(); clearDownloads(); }}
            title="Clear all messages and downloads"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="debug-input-bar">
        <label className="debug-input-checkbox" title="Send on every keystroke">
          <input
            type="checkbox"
            checked={sendOnKey}
            onChange={(e) => setSendOnKey(e.target.checked)}
            title="Send on every keystroke"
          />
        </label>
        <input
          id="debug-tab-input"
          type="text"
          className="debug-input-field"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyUp={handleKeyUp}
          placeholder={isRunning ? 'Type to inject...' : 'Deploy to enable'}
          disabled={!isRunning}
        />
        <button
          className={`debug-input-send ${sendOnKey ? 'hidden' : ''}`}
          onClick={handleSendText}
          disabled={!isRunning || !inputText}
          title="Inject text to nodes with 'Accept debug input' enabled"
        >
          <span className="debug-input-icon">{'\uf061'}</span>
        </button>
      </div>

      <div className="debug-content">
        {/* Messages Section */}
        <div className={`debug-section debug-section-messages ${sections.messages ? 'expanded' : 'collapsed'}`}>
          <div
            className="debug-section-header"
            onClick={() => toggleSection('messages')}
          >
            <span className={`section-toggle ${sections.messages ? 'expanded' : ''}`}>
              ▶
            </span>
            <span className="section-name">Messages</span>
            {messages.length > 0 && (
              <span className="section-badge">{messages.length}</span>
            )}
          </div>
          {sections.messages && (
            <div className="debug-section-content debug-messages">
              {messages.length === 0 ? (
                <div className="debug-empty-section">
                  No debug messages yet
                </div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className="debug-message">
                    <div className="debug-message-header">
                      <span className="debug-node-name">{msg.nodeName || 'debug'}</span>
                      <span className="debug-time">{formatTime(msg.timestamp)}</span>
                    </div>
                    {msg.topic && (
                      <div className="debug-topic">topic: {msg.topic}</div>
                    )}
                    {renderPayload(msg.payload)}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Files Section */}
        <div className={`debug-section debug-section-files ${sections.files ? 'expanded' : 'collapsed'}`}>
          <div
            className="debug-section-header"
            onClick={() => toggleSection('files')}
          >
            <span className={`section-toggle ${sections.files ? 'expanded' : ''}`}>
              ▶
            </span>
            <span className="section-name">Files</span>
            {downloads.length > 0 && (
              <span className="section-badge">{downloads.length}</span>
            )}
          </div>
          {sections.files && (
            <div className="debug-section-content">
              {downloads.length === 0 ? (
                <div className="debug-empty-section">
                  No files yet
                </div>
              ) : (
                downloads.map((download) => (
                  <div key={download.id} className="debug-download">
                    <div className="download-info">
                      <span
                        className="download-filename"
                        onClick={() => handleDownloadClick(download)}
                        title="Click to download"
                      >
                        {download.filename}
                      </span>
                      <span className="download-meta">
                        {download.size && formatSize(download.size)}
                        {' · '}
                        {download.nodeName}
                        {' · '}
                        {formatTime(download.timestamp)}
                      </span>
                    </div>
                    <button
                      className="download-remove"
                      onClick={() => removeDownload(download.id)}
                      title="Remove and free memory"
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
