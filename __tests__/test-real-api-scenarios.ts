/**
 * Test scenarios for real API vs mock API behavior
 */

import { analyzeImageWithFallback } from '@/lib/youcamClient';
import { AnalysisResponse } from '@/lib/types';

describe('Real API vs Mock API Scenarios', () => {
  // Force the mock path: jsdom cannot perform the real API fetch, and this
  // test only validates the mock result shape (repo .env enables the live API).
  const realApiEnv = process.env.NEXT_PUBLIC_USE_REAL_API;

  beforeEach(() => {
    window.localStorage.clear();
    delete process.env.NEXT_PUBLIC_USE_REAL_API;
  });

  afterEach(() => {
    if (realApiEnv === undefined) delete process.env.NEXT_PUBLIC_USE_REAL_API;
    else process.env.NEXT_PUBLIC_USE_REAL_API = realApiEnv;
  });

  it('should test mock data behavior', async () => {
    const testImageData = 'data:image/webp;base64,UklGRigAAABXRUJQVlA4ICAAAAAAACyZAEAAAAwAQCdASoBAAEAAQAcJaQAA3AA/v3AgAA=';
    
    console.log('Testing with mock data fallback...');
    
    const result = await analyzeImageWithFallback(testImageData);
    
    const hasCompleteAnalysis = (result: AnalysisResponse | null): result is AnalysisResponse => {
      if (!result) return false;
      const skin = result.skinAnalysis;
      const vto = result.vto;
      return Boolean(
        skin &&
          typeof skin.healthScore === 'number' &&
          Number.isFinite(skin.healthScore) &&
          skin.spots &&
          skin.texture &&
          skin.redness &&
          Array.isArray(skin.safetyFlags) &&
          Array.isArray(skin.barrierRepairRegimen) &&
          vto &&
          Array.isArray(vto.recommendedLipShades) &&
          vto.recommendedLipShades.length > 0 &&
          vto.outfitPalette,
      );
    };
    
    const isComplete = hasCompleteAnalysis(result);
    console.log('Mock data result:', {
      isComplete,
      healthScore: result.skinAnalysis?.healthScore,
      lipShadesCount: result.vto?.recommendedLipShades?.length,
    });
    
    expect(isComplete).toBe(true);
  });

  it('should analyze what makes data "incomplete"', () => {
    const hasCompleteAnalysis = (result: AnalysisResponse | null): result is AnalysisResponse => {
      if (!result) return false;
      const skin = result.skinAnalysis;
      const vto = result.vto;
      return Boolean(
        skin &&
          typeof skin.healthScore === 'number' &&
          Number.isFinite(skin.healthScore) &&
          skin.spots &&
          skin.texture &&
          skin.redness &&
          Array.isArray(skin.safetyFlags) &&
          Array.isArray(skin.barrierRepairRegimen) &&
          vto &&
          Array.isArray(vto.recommendedLipShades) &&
          vto.recommendedLipShades.length > 0 &&
          vto.outfitPalette,
      );
    };

    // Test empty lip shades scenario
    const incompleteData: AnalysisResponse = {
      skinAnalysis: {
        healthScore: 75,
        spots: { count: 5, severity: 'moderate' as const, description: 'Test' },
        texture: { smoothness: 70, roughness: 30, description: 'Test' },
        redness: { level: 40, description: 'Test' },
        safetyFlags: [],
        barrierRepairRegimen: []
      },
      vto: {
        recommendedLipShades: [],
        outfitPalette: { primary: '#FF0000', secondary: '#00FF00', accent: '#0000FF', inspiration: 'Test' },
        description: 'Test'
      },
      timestamp: new Date().toISOString(),
      imageWidth: 800,
      imageHeight: 600,
    };

    const isComplete = hasCompleteAnalysis(incompleteData);
    console.log('Incomplete data (empty lip shades):', isComplete);
    expect(isComplete).toBe(false);
  });

  it('should test complete data scenario', () => {
    const hasCompleteAnalysis = (result: AnalysisResponse | null): result is AnalysisResponse => {
      if (!result) return false;
      const skin = result.skinAnalysis;
      const vto = result.vto;
      return Boolean(
        skin &&
          typeof skin.healthScore === 'number' &&
          Number.isFinite(skin.healthScore) &&
          skin.spots &&
          skin.texture &&
          skin.redness &&
          Array.isArray(skin.safetyFlags) &&
          Array.isArray(skin.barrierRepairRegimen) &&
          vto &&
          Array.isArray(vto.recommendedLipShades) &&
          vto.recommendedLipShades.length > 0 &&
          vto.outfitPalette,
      );
    };

    // Test complete data scenario
    const completeData: AnalysisResponse = {
      skinAnalysis: {
        healthScore: 75,
        spots: { count: 5, severity: 'moderate' as const, description: 'Test' },
        texture: { smoothness: 70, roughness: 30, description: 'Test' },
        redness: { level: 40, description: 'Test' },
        safetyFlags: [{ id: 'test', severity: 'warning' as const, title: 'Test', description: 'Test', recommendation: 'Test' }],
        barrierRepairRegimen: [{ id: 'test', name: 'Test', activeIngredients: ['test'], frequency: 'test', notes: 'test' }]
      },
      vto: {
        recommendedLipShades: [{ name: 'Test', hexColor: '#000000', undertone: 'warm', description: 'Test' }],
        outfitPalette: { primary: '#FF0000', secondary: '#00FF00', accent: '#0000FF', inspiration: 'Test' },
        description: 'Test'
      },
      timestamp: new Date().toISOString(),
      imageWidth: 800,
      imageHeight: 600,
    };

    const isComplete = hasCompleteAnalysis(completeData);
    console.log('Complete data:', isComplete);
    expect(isComplete).toBe(true);
  });
});