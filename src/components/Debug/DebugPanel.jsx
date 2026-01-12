import { useState } from 'react';
import { useDebug } from '../../context/DebugContext';
import { useRuntime } from '../../context/RuntimeContext';
import './DebugPanel.css';

export function DebugPanel() {
  const { messages, enabled, clear, toggle } = useDebug();
  const { injectText, isRunning } = useRuntime();
  const [inputText, setInputText] = useState('');
  const [sendOnKey, setSendOnKey] = useState(false);

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
            onClick={clear}
            title="Clear all messages"
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

      <div className="debug-messages">
        {messages.length === 0 ? (
          <div className="debug-empty">
            No debug messages yet.
            <br />
            <span className="hint">Click an inject node button to send a message</span>
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
    </div>
  );
}
