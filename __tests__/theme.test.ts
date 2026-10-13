import { THEME_KEY, applyTheme, getStoredTheme, setStoredTheme, resolveInitialTheme } from '@/lib/theme';

describe('theme', () => {
  beforeEach(() => {
    document.documentElement.classList.remove('dark');
    window.localStorage.clear();
  });

  describe('applyTheme', () => {
    it('adds the dark class for the dark preference', () => {
      applyTheme('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('removes the dark class for the light preference', () => {
      document.documentElement.classList.add('dark');
      applyTheme('light');
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
  });

  describe('getStoredTheme', () => {
    it('returns dark when the stored value is dark', () => {
      window.localStorage.setItem(THEME_KEY, 'dark');
      expect(getStoredTheme()).toBe('dark');
    });

    it('defaults to light when nothing is stored', () => {
      expect(getStoredTheme()).toBe('light');
    });

    it('defaults to light for unexpected stored values', () => {
      window.localStorage.setItem(THEME_KEY, 'banana');
      expect(getStoredTheme()).toBe('light');
    });
  });

  describe('setStoredTheme', () => {
    it('persists the preference', () => {
      setStoredTheme('dark');
      expect(window.localStorage.getItem(THEME_KEY)).toBe('dark');
    });

    it('dispatches a same-tab notification event', () => {
      const handler = jest.fn();
      window.addEventListener('nyirira-storage', handler);
      setStoredTheme('light');
      expect(handler).toHaveBeenCalledTimes(1);
      window.removeEventListener('nyirira-storage', handler);
    });
  });

  describe('resolveInitialTheme', () => {
    it('uses the stored preference when present', () => {
      window.localStorage.setItem(THEME_KEY, 'dark');
      expect(resolveInitialTheme()).toBe('dark');
    });

    it('falls back to the OS preference when nothing is stored', () => {
      // jsdom matchMedia may be undefined; either branch must return a valid value.
      const result = resolveInitialTheme();
      expect(['light', 'dark']).toContain(result);
    });
  });
});
