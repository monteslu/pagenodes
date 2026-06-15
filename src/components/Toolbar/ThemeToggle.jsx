import { useState, useCallback } from 'react';
import { getTheme, toggleTheme } from '../../utils/theme';

// Sun glyph in light mode, moon glyph in dark mode (FontAwesome solid unicode).
const SUN = '';
const MOON = '';

export function ThemeToggle() {
  const [theme, setThemeState] = useState(getTheme);

  const onToggle = useCallback(() => {
    setThemeState(toggleTheme());
  }, []);

  return (
    <button
      className="toolbar-btn theme-toggle"
      onClick={onToggle}
      title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      aria-label="Toggle light and dark theme"
    >
      <span className="node-icon">{theme === 'dark' ? MOON : SUN}</span>
    </button>
  );
}
