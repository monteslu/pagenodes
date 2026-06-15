// Theme handling for PATCHBAY. The active theme lives as data-theme on the
// document root so plain CSS can switch every token. A head script in
// index.html sets the initial value before paint to avoid a flash.

const STORAGE_KEY = 'pn-theme';

export function getTheme() {
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

export function setTheme(theme) {
  const t = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', t);
  try {
    localStorage.setItem(STORAGE_KEY, t);
  } catch {
    // localStorage may be unavailable; the attribute still applies for this session
  }
  return t;
}

export function toggleTheme() {
  return setTheme(getTheme() === 'dark' ? 'light' : 'dark');
}
