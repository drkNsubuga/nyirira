import { transformSkinData, transformVTOData } from '@/lib/youcamClient';

/**
 * Real payload captured from a live YouCam v2 run (Playwright e2e against
 * img/confidence-with-hyperpigmentation-v0-397eauo43yoh1.webp):
 * task success → results.output[] of { type, ui_score, raw_score } entries.
 * ui_score is the consumer-facing 0–100 score, higher = better condition.
 */
const REAL_SKIN_OUTPUT = [
  { ui_score: 99, raw_score: 100.0, type: 'redness' },
  { ui_score: 75, raw_score: 66.50981903076172, type: 'radiance' },
  { ui_score: 89, raw_score: 92.93787479400635, type: 'texture' },
  { ui_score: 79, raw_score: 87.354553033447266, type: 'age_spot' },
  { score: 885.5, type: 'all', url: null },
  { score: 31, type: 'skin_age', url: null },
  { type: 'resize_image' },
];

describe('live YouCam response mapping', () => {
  it('maps results.output[] to non-zero dashboard numbers', () => {
    const skin = transformSkinData({ output: REAL_SKIN_OUTPUT });

    // round((99 + 75 + 89 + 79) / 4) = 86
    expect(skin.healthScore).toBe(86);
    expect(skin.texture.smoothness).toBe(89);
    expect(skin.texture.roughness).toBe(11);
    expect(skin.redness.level).toBe(1); // 100 - 99
    // The live API reports pigmentation as a score, not a spot count — the
    // count must stay 0 (rendered as "—") rather than a fabricated number.
    expect(skin.spots.count).toBe(0);
    expect(skin.spots.severity).toBe('moderate'); // age_spot 79 → 60..79
    expect(skin.spots.description).toContain('79/100');
    // Static app content (safety advice + local regimen) is always present.
    expect(skin.safetyFlags.length).toBeGreaterThan(0);
    expect(skin.barrierRepairRegimen.length).toBeGreaterThan(0);
  });

  it('returns neutral zeros for an unrecognized shape so the UI guard rejects it', () => {
    const skin = transformSkinData({ somethingElse: true });
    expect(skin.healthScore).toBe(0);
    expect(skin.spots.count).toBe(0);
    expect(skin.texture.smoothness).toBe(0);
  });

  it('clamps out-of-range scores to 0-100', () => {
    const skin = transformSkinData({ output: [{ type: 'redness', ui_score: 250 }] });
    expect(skin.redness.level).toBe(0); // 100 - clamp(250 → 100)
  });

  it('keeps pre-shaped payloads working (legacy branch)', () => {
    const skin = transformSkinData({
      healthScore: 72,
      spots: { count: 8, severity: 'mild', description: 'spots' },
      texture: { smoothness: 68, roughness: 32, description: 'ok' },
      redness: { level: 35, description: 'ok' },
      safetyFlags: [],
      barrierRepairRegimen: [],
    });
    expect(skin.healthScore).toBe(72);
    expect(skin.spots.count).toBe(8);
    expect(skin.texture.smoothness).toBe(68);
  });
});

describe('live look-vto mapping', () => {
  it('maps the real { url } payload to a try-on image plus curated style', () => {
    const vto = transformVTOData({
      url: 'https://yce-us.s3-accelerate.amazonaws.com/result.jpg?X-Amz-Signature=abc',
    });
    expect(vto.tryOnImageUrl).toBe(
      'https://yce-us.s3-accelerate.amazonaws.com/result.jpg?X-Amz-Signature=abc',
    );
    expect(vto.recommendedLipShades.length).toBeGreaterThan(0);
    expect(vto.outfitPalette.primary).toBeTruthy();
    expect(vto.description).toContain('try-on');
  });

  it('omits tryOnImageUrl when the payload has no url', () => {
    const vto = transformVTOData({});
    expect(vto.tryOnImageUrl).toBeUndefined();
    expect(vto.recommendedLipShades.length).toBeGreaterThan(0);
  });
});
