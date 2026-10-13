import '@testing-library/jest-dom';
import { render, screen, fireEvent, act } from '@testing-library/react';
import SettingsPage from '@/app/settings/page';
import { defaultSettings, getAppSettings, SETTINGS_KEY } from '@/lib/storage';
import { THEME_KEY } from '@/lib/theme';

describe('SettingsPage', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('renders the live-API toggle with its stored state', () => {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...defaultSettings, useRealAPI: true }));
    render(<SettingsPage />);
    expect(screen.getByLabelText('Toggle live API')).toBeInTheDocument();
  });

  it('toggling a setting persists it to storage', () => {
    render(<SettingsPage />);
    act(() => {
      fireEvent.click(screen.getByLabelText('Toggle live API'));
    });
    expect(getAppSettings().useRealAPI).toBe(true);

    act(() => {
      fireEvent.click(screen.getByLabelText('Toggle live API'));
    });
    expect(getAppSettings().useRealAPI).toBe(false);
  });

  it('marks unavailable features as coming soon instead of live toggles', () => {
    render(<SettingsPage />);
    expect(screen.getAllByText('Coming soon').length).toBeGreaterThanOrEqual(3);
    expect(screen.getByText('Push notifications')).toBeInTheDocument();
    expect(screen.getByText('Google')).toBeInTheDocument();
    // No toggle button rendered for notifications (it is a disabled badge).
    expect(screen.queryByLabelText('Toggle notifications')).not.toBeInTheDocument();
  });

  it('dark mode toggle reflects the stored theme and toggles the html class', () => {
    render(<SettingsPage />);
    const darkSwitch = screen.getByRole('switch', { name: /toggle dark mode/i });
    expect(darkSwitch).toHaveAttribute('aria-checked', 'false');

    act(() => {
      fireEvent.click(darkSwitch);
    });

    expect(window.localStorage.getItem(THEME_KEY)).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(screen.getByRole('switch', { name: /toggle dark mode/i })).toHaveAttribute('aria-checked', 'true');
  });
});

