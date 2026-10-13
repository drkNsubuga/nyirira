import { AnalysisResponse } from './types';

export type AnalysisHistoryItem = {
  id: string;
  createdAt: string;
  summary: string;
  imageData: string;
  analysis: AnalysisResponse;
};

export type AppSettings = {
  useRealAPI: boolean;
  notifications: boolean;
  enableSocialSharing: boolean;
  googleConnected: boolean;
  facebookConnected: boolean;
};

export const HISTORY_KEY = 'nyirira_history';
export const SETTINGS_KEY = 'nyirira_settings';
export const ANALYSIS_KEY = 'nyirira_analysis';

/**
 * Custom event fired (in the same tab) after any Nyirira storage write.
 * Browsers only fire the native 'storage' event for cross-tab changes, so
 * useSyncExternalStore subscribers in the same tab need this too.
 */
export const NYIRIRA_STORAGE_EVENT = 'nyirira-storage';

function notifyStorageChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(NYIRIRA_STORAGE_EVENT));
  }
}

/** Parse a stored settings JSON string, falling back to defaults. */
export function parseSettings(raw: string | null): AppSettings {
  if (!raw) {
    return defaultSettings;
  }

  try {
    return {
      ...defaultSettings,
      ...(JSON.parse(raw) as Partial<AppSettings>),
    };
  } catch {
    return defaultSettings;
  }
}

export const defaultSettings: AppSettings = {
  useRealAPI: false,
  notifications: true,
  enableSocialSharing: true,
  googleConnected: false,
  facebookConnected: false,
};

/** Parse a stored history JSON string, capped at 6 items. */
export function parseHistory(raw: string | null): AnalysisHistoryItem[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as AnalysisHistoryItem[];
    return Array.isArray(parsed) ? parsed.slice(0, 6) : [];
  } catch {
    return [];
  }
}

/** Parse a stored single-analysis JSON string, or null if absent/corrupt. */
export function parseAnalysis(raw: string | null): AnalysisResponse | null {
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AnalysisResponse;
  } catch {
    return null;
  }
}

export function getAnalysisHistory(): AnalysisHistoryItem[] {
  if (typeof window === 'undefined') {
    return [];
  }

  return parseHistory(window.localStorage.getItem(HISTORY_KEY));
}

export function saveAnalysisHistory(items: AnalysisHistoryItem[]) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 6)));
  notifyStorageChange();
}

export function addAnalysisToHistory(item: AnalysisHistoryItem) {
  const next = [item, ...getAnalysisHistory()].slice(0, 6);
  saveAnalysisHistory(next);
  return next;
}

export function getAppSettings(): AppSettings {
  if (typeof window === 'undefined') {
    return defaultSettings;
  }

  return parseSettings(window.localStorage.getItem(SETTINGS_KEY));
}

export function saveAppSettings(settings: AppSettings) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  notifyStorageChange();
}

/** Persist the latest analysis for restore-on-reload and notify subscribers. */
export function saveAnalysis(analysis: AnalysisResponse) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(ANALYSIS_KEY, JSON.stringify(analysis));
  notifyStorageChange();
}
