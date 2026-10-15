import {
  SCAN_PHASES,
  MESSAGE_ROTATION_MS,
  getPhaseForProgress,
  getMessageIndex,
} from '@/lib/scanMessages';

describe('scanMessages', () => {
  it('defines contiguous, non-empty phases covering 0-100', () => {
    expect(SCAN_PHASES[0].min).toBe(0);
    SCAN_PHASES.forEach((p, i) => {
      expect(p.max).toBeGreaterThan(p.min);
      expect(p.label.length).toBeGreaterThan(0);
      expect(p.messages.length).toBeGreaterThan(0);
      p.messages.forEach((m) => expect(m.length).toBeGreaterThan(0));
      if (i > 0) {
        expect(p.min).toBe(SCAN_PHASES[i - 1].max);
      }
    });
    expect(SCAN_PHASES[SCAN_PHASES.length - 1].max).toBeGreaterThanOrEqual(100);
  });

  it('maps progress values to the expected phase', () => {
    expect(getPhaseForProgress(0).label).toBe('Preparing');
    expect(getPhaseForProgress(14).label).toBe('Preparing');
    expect(getPhaseForProgress(15).label).toBe('Face Detection');
    expect(getPhaseForProgress(34).label).toBe('Face Detection');
    expect(getPhaseForProgress(35).label).toBe('Skin Analysis');
    expect(getPhaseForProgress(55).label).toBe('Color Matching');
    expect(getPhaseForProgress(80).label).toBe('Finalizing');
    expect(getPhaseForProgress(100).label).toBe('Finalizing');
    // Out-of-range progress falls back to the last phase.
    expect(getPhaseForProgress(999).label).toBe('Finalizing');
    expect(getPhaseForProgress(-5).label).toBe('Preparing');
  });

  it('computes rotating message indices from elapsed time', () => {
    expect(getMessageIndex(0, 3)).toBe(0);
    expect(getMessageIndex(MESSAGE_ROTATION_MS - 1, 3)).toBe(0);
    expect(getMessageIndex(MESSAGE_ROTATION_MS, 3)).toBe(1);
    expect(getMessageIndex(MESSAGE_ROTATION_MS * 2, 3)).toBe(2);
    // Wraps around the message list.
    expect(getMessageIndex(MESSAGE_ROTATION_MS * 3, 3)).toBe(0);
  });
});
