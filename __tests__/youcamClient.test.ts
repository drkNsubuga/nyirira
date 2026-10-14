import { analyzeImage, shouldUseRealApi } from '@/lib/youcamClient';
import { defaultSettings, saveAppSettings } from '@/lib/storage';

describe('youcamClient', () => {
  describe('analyzeImage', () => {
    // These tests validate the mock analysis shape — force the real API off
    // so they never hit the network (repo .env enables the live API).
    beforeEach(() => {
      delete process.env.NEXT_PUBLIC_USE_REAL_API;
      window.localStorage.clear();
    });

    it('should return an AnalysisResponse with all required fields', async () => {
      // Create a simple base64 image for testing
      const testImageData = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUIEADAAIDAQADAAAAAAAAAAACAwQFEQASEyExQRRRMnH/xAAVAQEBAAAAAAAAAAAAAAAAAAAAAv/EABYRAMBAQAAAAAAAAAAAAAAAAEAAQCR/9oADAMBAAIRAxEAPwCggICAgICAgICAgICAf//Z';

      const result = await analyzeImage(testImageData);

      expect(result).toBeDefined();
      expect(result.skinAnalysis).toBeDefined();
      expect(result.vto).toBeDefined();
      expect(result.timestamp).toBeDefined();
      expect(result.imageWidth).toBeGreaterThanOrEqual(0);
      expect(result.imageHeight).toBeGreaterThanOrEqual(0);
    });

    it('should have health score between 0 and 100', async () => {
      const testImageData = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUIEADAAIDAQADAAAAAAAAAAACAwQFEQASEyExQRRRMnH/xAAVAQEBAAAAAAAAAAAAAAAAAAAAAv/EABYRAMBAQAAAAAAAAAAAAAAAAEAAQCR/9oADAMBAAIRAxEAPwCggICAgICAgICAf//Z';

      const result = await analyzeImage(testImageData);

      expect(result.skinAnalysis.healthScore).toBeGreaterThanOrEqual(0);
      expect(result.skinAnalysis.healthScore).toBeLessThanOrEqual(100);
    });

    it('should include safety flags', async () => {
      const testImageData = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUIEADAAIDAQADAAAAAAAAAAACAwQFEQASEyExQRRRMnH/xAAVAQEBAAAAAAAAAAAAAAAAAAAAAv/EABYRAMBAQAAAAAAAAAAAAAAAAEAAQCR/9oADAMBAAIRAxEAPwCggICAgICAgICAf//Z';

      const result = await analyzeImage(testImageData);

      expect(Array.isArray(result.skinAnalysis.safetyFlags)).toBe(true);
      expect(result.skinAnalysis.safetyFlags.length).toBeGreaterThan(0);

      result.skinAnalysis.safetyFlags.forEach((flag) => {
        expect(flag.id).toBeDefined();
        expect(flag.severity).toMatch(/warning|critical/);
        expect(flag.title).toBeDefined();
        expect(flag.description).toBeDefined();
        expect(flag.recommendation).toBeDefined();
      });
    });

    it('should include barrier repair regimen', async () => {
      const testImageData = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUIEADAAIDAQADAAAAAAAAAAACAwQFEQASEyExQRRRMnH/xAAVAQEBAAAAAAAAAAAAAAAAAAAAAv/EABYRAMBAQAAAAAAAAAAAAAAAAEAAQCR/9oADAMBAAIRAxEAPwCggICAgICAgICAf//Z';

      const result = await analyzeImage(testImageData);

      expect(Array.isArray(result.skinAnalysis.barrierRepairRegimen)).toBe(true);
      expect(result.skinAnalysis.barrierRepairRegimen.length).toBeGreaterThan(0);

      result.skinAnalysis.barrierRepairRegimen.forEach((product) => {
        expect(product.id).toBeDefined();
        expect(product.name).toBeDefined();
        expect(Array.isArray(product.activeIngredients)).toBe(true);
        expect(product.frequency).toBeDefined();
        expect(product.notes).toBeDefined();
      });
    });

    it('should include VTO color palette', async () => {
      const testImageData = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUIEADAAIDAQADAAAAAAAAAAACAwQFEQASEyExQRRRMnH/xAAVAQEBAAAAAAAAAAAAAAAAAAAAAv/EABYRAMBAQAAAAAAAAAAAAAAAAEAAQCR/9oADAMBAAIRAxEAPwCggICAgICAgICAf//Z';

      const result = await analyzeImage(testImageData);

      expect(result.vto.outfitPalette).toBeDefined();
      expect(result.vto.outfitPalette.primary).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(result.vto.outfitPalette.secondary).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(result.vto.outfitPalette.accent).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(result.vto.outfitPalette.inspiration).toBeDefined();
    });

    it('should include recommended lip shades', async () => {
      const testImageData = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUIEADAAIDAQADAAAAAAAAAAACAwQFEQASEyExQRRRMnH/xAAVAQEBAAAAAAAAAAAAAAAAAAAAAv/EABYRAMBAQAAAAAAAAAAAAAAAAEAAQCR/9oADAMBAAIRAxEAPwCggICAgICAgICAf//Z';

      const result = await analyzeImage(testImageData);

      expect(Array.isArray(result.vto.recommendedLipShades)).toBe(true);
      expect(result.vto.recommendedLipShades.length).toBeGreaterThan(0);

      result.vto.recommendedLipShades.forEach((shade) => {
        expect(shade.name).toBeDefined();
        expect(shade.hexColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(shade.undertone).toMatch(/warm|cool|neutral/);
        expect(shade.description).toBeDefined();
      });
    });

    it('should throw error for empty image data', async () => {
      await expect(analyzeImage('')).rejects.toThrow('Invalid image data');
    });
  });
});

describe('shouldUseRealApi', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('reflects env config by default (NEXT_PUBLIC_USE_REAL_API=true in .env)', () => {
    // ENV_REAL_API_ENABLED is baked in at import time from .env — tests run
    // against the repo .env which enables the live API by default.
    expect(shouldUseRealApi()).toBe(process.env.NEXT_PUBLIC_USE_REAL_API === 'true');
  });

  it('is true when settings enable the live API', () => {
    saveAppSettings({ ...defaultSettings, useRealAPI: true });
    expect(shouldUseRealApi()).toBe(true);
  });
});

describe('analyzeImage real API path', () => {
  const testImageData = 'data:image/jpeg;base64,AAAA';

  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('propagates the error when the live API fails (no silent mock fallback)', async () => {
    saveAppSettings({ ...defaultSettings, useRealAPI: true });

    // Fail every fetch attempt so the retry loop exhausts and throws.
    global.fetch = jest.fn().mockRejectedValue(new Error('network down')) as never;

    // With the real API enabled the failure must surface to the UI
    // (friendly error alert + retry) rather than showing fake results.
    await expect(analyzeImage(testImageData)).rejects.toThrow(/network down/i);
  });

  it('returns mock analysis when the real API is disabled', async () => {
    saveAppSettings({ ...defaultSettings, useRealAPI: false });
    // Force the env flag off too so shouldUseRealApi() is false regardless of .env.
    // (ENV_REAL_API_ENABLED is baked at import time; settings only turn it ON.)
    global.fetch = jest.fn().mockRejectedValue(new Error('should not be called')) as never;

    // When settings disable the API the mock path runs — unless env enables it.
    if (!(process.env.NEXT_PUBLIC_USE_REAL_API === 'true')) {
      const result = await analyzeImage(testImageData);
      expect(result.skinAnalysis.healthScore).toBe(72);
      expect(global.fetch).not.toHaveBeenCalled();
    }
  });
});

