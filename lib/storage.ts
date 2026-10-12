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

export const defaultSettings: AppSettings = {
  useRealAPI: false,
  notifications: true,
  enableSocialSharing: true,
  googleConnected: false,
  facebookConnected: false,
};

export function getAnalysisHistory(): AnalysisHistoryItem[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as AnalysisHistoryItem[];
    return Array.isArray(parsed) ? parsed.slice(0, 6) : [];
  } catch {
    return [];
  }
}

export function saveAnalysisHistory(items: AnalysisHistoryItem[]) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 6)));
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

  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      return defaultSettings;
    }

    return {
      ...defaultSettings,
      ...JSON.parse(raw),
    } as AppSettings;
  } catch {
    return defaultSettings;
  }
}

export function saveAppSettings(settings: AppSettings) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
