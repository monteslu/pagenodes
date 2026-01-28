import { useState, useCallback } from 'react';
import { useRuntime } from '../../context/runtime.js';
import './PasswordPrompt.css';

export function PasswordPrompt() {
  const { submitPassword, authError } = useRuntime();
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!password || submitting) return;
    setSubmitting(true);
    await submitPassword(password);
    setSubmitting(false);
    setPassword('');
  }, [password, submitting, submitPassword]);

  return (
    <div className="password-prompt-overlay">
      <div className="password-prompt">
        <div className="password-prompt-header">
          <h2>PageNodes</h2>
        </div>
        <form className="password-prompt-form" onSubmit={handleSubmit}>
          <p className="password-prompt-desc">This server requires a password to access the editor.</p>
          <input
            type="password"
            className="password-prompt-input"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            disabled={submitting}
          />
          {authError && <div className="password-prompt-error">{authError}</div>}
          <button
            type="submit"
            className="password-prompt-btn"
            disabled={!password || submitting}
          >
            {submitting ? 'Authenticating...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
