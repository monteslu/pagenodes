import { useState, useCallback, useEffect } from 'react';
import { useStorage } from '../../context/StorageContext';
import { useRuntime } from '../../context/runtime.js';
import './SettingsDialog.css';

export function SettingsDialog({ onClose, onSettingsChange }) {
  const storage = useStorage();
  const { mode } = useRuntime();
  const [mcpEnabled, setMcpEnabled] = useState(false);
  const [mcpPort, setMcpPort] = useState(7778);
  const [hasPassword, setHasPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(true);

  // Load settings on mount
  useEffect(() => {
    storage.getSettings().then(settings => {
      setMcpEnabled(settings.mcpEnabled);
      setMcpPort(settings.mcpPort);
      setHasPassword(!!settings.hasPassword);
      setLoading(false);
    });
  }, [storage]);

  const handleSave = useCallback(async () => {
    // Validate password fields
    if (newPassword && newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    setPasswordError('');

    // password value: string = set/change, null = remove, true = unchanged
    let passwordValue = true;
    if (newPassword) {
      passwordValue = newPassword;
    }

    const settings = { mcpEnabled, mcpPort, password: passwordValue };
    try {
      await storage.saveSettings(settings);
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
    onSettingsChange?.(settings);
    onClose();
  }, [mcpEnabled, mcpPort, newPassword, confirmPassword, onClose, onSettingsChange, storage]);

  const handleRemovePassword = useCallback(async () => {
    const settings = { mcpEnabled, mcpPort, password: null };
    try {
      await storage.saveSettings(settings);
      setHasPassword(false);
      setNewPassword('');
      setConfirmPassword('');
      setPasswordError('');
    } catch (err) {
      console.error('Failed to remove password:', err);
    }
  }, [mcpEnabled, mcpPort, storage]);

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
          {mode === 'server' && (
            <div className="settings-section">
              <h3 className="settings-section-title">Security</h3>
              <p className="settings-section-desc">
                Require a password to access the editor. Leave blank to keep unchanged.
              </p>

              {hasPassword && (
                <div className="settings-info">
                  A password is currently set.
                  <button
                    className="settings-remove-password"
                    onClick={handleRemovePassword}
                  >
                    Remove password
                  </button>
                </div>
              )}

              <div className="settings-row settings-row-col">
                <label className="settings-label">{hasPassword ? 'New Password' : 'Password'}</label>
                <input
                  type="password"
                  className="settings-input settings-password-input"
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setPasswordError(''); }}
                  placeholder={hasPassword ? 'Leave blank to keep current' : 'No password set'}
                  autoComplete="new-password"
                />
              </div>

              {newPassword && (
                <div className="settings-row settings-row-col">
                  <label className="settings-label">Confirm Password</label>
                  <input
                    type="password"
                    className="settings-input settings-password-input"
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(''); }}
                    placeholder="Confirm password"
                    autoComplete="new-password"
                  />
                </div>
              )}

              {passwordError && (
                <div className="settings-error">{passwordError}</div>
              )}
            </div>
          )}

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
