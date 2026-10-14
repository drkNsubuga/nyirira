import {
  ANALYSIS_KEY,
  HISTORY_KEY,
  SETTINGS_KEY,
  NYIRIRA_STORAGE_EVENT,
  addAnalysisToHistory,
  clearAnalysisHistory,
  removeAnalysisFromHistory,
  defaultSettings,
  getAnalysisHistory,
  getAppSettings,
  parseAnalysis,
  parseHistory,
  parseSettings,
  saveAnalysis,
  saveAnalysisHistory,
  saveAppSettings,
  type AnalysisHistoryItem,
} from '@/lib/storage';
import { AnalysisResponse } from '@/lib/types';

function makeAnalysis(score = 72, ts = '2026-10-12T10:00:00.000Z'): AnalysisResponse {
  return {
    skinAnalysis: {
      healthScore: score,
      spots: { count: 1, severity: 'mild', description: '' },
      texture: { smoothness: 70, roughness: 30, description: '' },
      redness: { level: 10, description: '' },
      safetyFlags: [],
      barrierRepairRegimen: [],
    },
    vto: {
      recommendedLipShades: [],
      outfitPalette: { primary: '#000', secondary: '#000', accent: '#000', inspiration: '' },
      description: '',
    },
    timestamp: ts,
    imageWidth: 0,
    imageHeight: 0,
  };
}

function makeItem(id: string): AnalysisHistoryItem {
  return { id, createdAt: '2026-10-12T10:00:00.000Z', summary: 'x', imageData: 'data:,', analysis: makeAnalysis() };
}

describe('storage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  describe('pure parse helpers', () => {
    it('parseSettings returns defaults for null', () => {
      expect(parseSettings(null)).toEqual(defaultSettings);
    });

    it('parseSettings merges stored values over defaults', () => {
      const parsed = parseSettings(JSON.stringify({ useRealAPI: true }));
      expect(parsed.useRealAPI).toBe(true);
      expect(parsed.enableSocialSharing).toBe(defaultSettings.enableSocialSharing);
    });

    it('parseSettings falls back to defaults on corrupt JSON', () => {
      expect(parseSettings('{not json')).toEqual(defaultSettings);
    });

    it('parseHistory returns [] for null / corrupt / non-array', () => {
      expect(parseHistory(null)).toEqual([]);
      expect(parseHistory('{bad')).toEqual([]);
      expect(parseHistory('"a string"')).toEqual([]);
    });

    it('parseHistory caps the result at 6 items', () => {
      const raw = JSON.stringify(Array.from({ length: 10 }, (_, i) => makeItem(String(i))));
      expect(parseHistory(raw)).toHaveLength(6);
    });

    it('parseAnalysis returns null for null / corrupt input', () => {
      expect(parseAnalysis(null)).toBeNull();
      expect(parseAnalysis('{bad')).toBeNull();
    });

    it('parseAnalysis returns the parsed object for valid input', () => {
      const analysis = makeAnalysis(55);
      expect(parseAnalysis(JSON.stringify(analysis))?.skinAnalysis.healthScore).toBe(55);
    });
  });

  describe('history persistence', () => {
    it('getAnalysisHistory returns [] when nothing is stored', () => {
      expect(getAnalysisHistory()).toEqual([]);
    });

    it('addAnalysisToHistory prepends the new item and persists it', () => {
      addAnalysisToHistory(makeItem('a'));
      addAnalysisToHistory(makeItem('b'));
      const history = getAnalysisHistory();
      expect(history.map((i) => i.id)).toEqual(['b', 'a']);
      expect(window.localStorage.getItem(HISTORY_KEY)).toContain('"b"');
    });

    it('addAnalysisToHistory keeps at most 6 items', () => {
      for (let i = 0; i < 9; i += 1) addAnalysisToHistory(makeItem(String(i)));
      expect(getAnalysisHistory()).toHaveLength(6);
    });

    it('clearAnalysisHistory removes all items and the stored key', () => {
      addAnalysisToHistory(makeItem('a'));
      addAnalysisToHistory(makeItem('b'));
      expect(getAnalysisHistory()).toHaveLength(2);

      clearAnalysisHistory();
      expect(getAnalysisHistory()).toEqual([]);
      expect(window.localStorage.getItem(HISTORY_KEY)).toBeNull();
    });

    it('removeAnalysisFromHistory removes only the matching item', () => {
      addAnalysisToHistory(makeItem('a'));
      addAnalysisToHistory(makeItem('b'));
      addAnalysisToHistory(makeItem('c'));

      const remaining = removeAnalysisFromHistory('b');
      expect(remaining.map((i) => i.id)).toEqual(['c', 'a']);
      expect(getAnalysisHistory().map((i) => i.id)).toEqual(['c', 'a']);
    });

    it('saveAnalysisHistory stores at most 6 items and notifies', () => {
      const handler = jest.fn();
      window.addEventListener(NYIRIRA_STORAGE_EVENT, handler);
      saveAnalysisHistory(Array.from({ length: 10 }, (_, i) => makeItem(String(i))));
      expect(getAnalysisHistory()).toHaveLength(6);
      expect(handler).toHaveBeenCalledTimes(1);
      window.removeEventListener(NYIRIRA_STORAGE_EVENT, handler);
    });
  });

  describe('settings persistence', () => {
    it('getAppSettings returns defaults when nothing is stored', () => {
      expect(getAppSettings()).toEqual(defaultSettings);
    });

    it('saveAppSettings persists and notifies subscribers', () => {
      const handler = jest.fn();
      window.addEventListener(NYIRIRA_STORAGE_EVENT, handler);
      saveAppSettings({ ...defaultSettings, useRealAPI: true });
      expect(getAppSettings().useRealAPI).toBe(true);
      expect(handler).toHaveBeenCalledTimes(1);
      window.removeEventListener(NYIRIRA_STORAGE_EVENT, handler);
    });
  });

  describe('single analysis persistence', () => {
    it('saveAnalysis persists and notifies', () => {
      const handler = jest.fn();
      window.addEventListener(NYIRIRA_STORAGE_EVENT, handler);
      const analysis = makeAnalysis(90);
      saveAnalysis(analysis);
      expect(window.localStorage.getItem(ANALYSIS_KEY)).toContain('"healthScore":90');
      expect(parseAnalysis(window.localStorage.getItem(ANALYSIS_KEY))).not.toBeNull();
      expect(handler).toHaveBeenCalledTimes(1);
      window.removeEventListener(NYIRIRA_STORAGE_EVENT, handler);
    });
  });

  it('exports the documented storage keys', () => {
    expect(ANALYSIS_KEY).toBe('nyirira_analysis');
    expect(HISTORY_KEY).toBe('nyirira_history');
    expect(SETTINGS_KEY).toBe('nyirira_settings');
  });
});
