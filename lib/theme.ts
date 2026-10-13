/**
 * Theme helpers (manual dark mode toggle — TODO backlog)
 *
 * Tailwind v4 uses `@custom-variant dark` configured in globals.css to respond
 * to a `.dark` class on the <html> element. We toggle that class here and
 * persist the preference in localStorage.
 */

export type ThemePreference = 'light' | 'dark';

export const THEME_KEY = 'nyirira_theme';

export function applyTheme(theme: ThemePreference): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

export function getStoredTheme(): ThemePreference {
  if (typeof window === 'undefined') return 'light';
  try {
    const stored = window.localStorage.getItem(THEME_KEY);
    return stored === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function setStoredTheme(theme: ThemePreference): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(THEME_KEY, theme);
    // Same-tab subscribers (useSyncExternalStore) need a local notification;
    // the native 'storage' event only fires in other tabs.
    window.dispatchEvent(new Event('nyirira-storage'));
  } catch {
    // Ignore storage failures — theme still applies for the session.
  }
}

export function resolveInitialTheme(): ThemePreference {
  if (typeof window === 'undefined') return 'light';
  const stored = getStoredTheme();
  if (stored) return stored;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
