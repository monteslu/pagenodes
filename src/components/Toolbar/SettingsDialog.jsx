import { useState, useCallback, useEffect } from 'react';
import { storage } from '../../utils/storage';
import './SettingsDialog.css';

export function SettingsDialog({ onClose, onSettingsChange }) {
  const [mcpEnabled, setMcpEnabled] = useState(false);
  const [mcpPort, setMcpPort] = useState(7778);
  const [loading, setLoading] = useState(true);

  // Load settings on mount
  useEffect(() => {
    storage.getSettings().then(settings => {
      setMcpEnabled(settings.mcpEnabled);
      setMcpPort(settings.mcpPort);
      setLoading(false);
    });
  }, []);

  const handleSave = useCallback(async () => {
    const settings = { mcpEnabled, mcpPort };
    await storage.saveSettings(settings);
    onSettingsChange?.(settings);
    onClose();
  }, [mcpEnabled, mcpPort, onClose, onSettingsChange]);

  const handleOverlayClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  if (loading) {
    return null;
  }

  return (
    <div className="settings-dialog-overlay" onClick={handleOverlayClick} onKeyDown={handleKeyDown}>
      <div className="settings-dialog">
        <div className="settings-dialog-header">
          <span className="settings-dialog-title">Settings</span>
          <button className="settings-dialog-close" onClick={onClose}>&times;</button>
        </div>

        <div className="settings-dialog-content">
          <div className="settings-section">
            <h3 className="settings-section-title">MCP Integration</h3>
            <p className="settings-section-desc">
              Enable Claude AI to edit and deploy flows via MCP (Model Context Protocol).
            </p>

            <div className="settings-row">
              <label className="settings-checkbox-label">
                <input
                  type="checkbox"
                  checked={mcpEnabled}
                  onChange={(e) => setMcpEnabled(e.target.checked)}
                />
                <span>Enable MCP Server Connection</span>
              </label>
            </div>

            <div className="settings-row">
              <label className="settings-label">Port</label>
              <input
                type="number"
                className="settings-input settings-port-input"
                value={mcpPort}
                onChange={(e) => setMcpPort(parseInt(e.target.value, 10) || 7778)}
                disabled={!mcpEnabled}
                min="1024"
                max="65535"
              />
              <span className="settings-hint">Default: 7778</span>
            </div>

            {mcpEnabled && (
              <div className="settings-info">
                Run <code>npx pagenodes-mcp --port {mcpPort}</code> to start the MCP server.
              </div>
            )}
          </div>
        </div>

        <div className="settings-dialog-footer">
          <button className="btn btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-save" onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
