/**
 * Test the API endpoint for image analysis
 */

import { analyzeImageWithFallback } from '@/lib/youcamClient';
import { AnalysisResponse } from '@/lib/types';

describe('API Endpoint Test', () => {
  // Force the mock path: these tests validate the response shape, and jsdom
  // cannot perform the real API fetch (the repo .env enables the live API).
  const realApiEnv = process.env.NEXT_PUBLIC_USE_REAL_API;

  beforeEach(() => {
    window.localStorage.clear();
    delete process.env.NEXT_PUBLIC_USE_REAL_API;
  });

  afterEach(() => {
    if (realApiEnv === undefined) delete process.env.NEXT_PUBLIC_USE_REAL_API;
    else process.env.NEXT_PUBLIC_USE_REAL_API = realApiEnv;
  });

  it('should test the analyzeImageWithFallback function directly', async () => {
    // Create a simple test image data (base64 encoded 1x1 pixel)
    const testImageData = 'data:image/webp;base64,UklGRigAAABXRUJQVlA4ICAAAAAAACyZAEAAAAwAQCdASoBAAEAAQAcJaQAA3AA/v3AgAA=';
    
    console.log('Testing analyzeImageWithFallback with test image data...');
    
    try {
      const result: AnalysisResponse = await analyzeImageWithFallback(testImageData);
      
      console.log('Analysis completed successfully');
      console.log('Result structure:', {
        hasSkinAnalysis: !!result.skinAnalysis,
        hasVTO: !!result.vto,
        lipShadesCount: result.vto?.recommendedLipShades?.length || 0,
        hasOutfitPalette: !!result.vto?.outfitPalette,
        healthScore: result.skinAnalysis?.healthScore,
        timestamp: result.timestamp,
      });
      
      // Check if the result is complete
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
      console.log('Is analysis complete:', isComplete);
      
      expect(result).toBeDefined();
      expect(result.skinAnalysis).toBeDefined();
      expect(result.vto).toBeDefined();
      expect(isComplete).toBe(true);
      
    } catch (error) {
      console.error('Analysis failed:', error);
      throw error;
    }
  });

  it('should test with mock data structure validation', async () => {
    // Test with a minimal valid image data
    const minimalImageData = 'data:image/webp;base64,UklGRigAAABXRUJQVlA4ICAAAAAAACyZAEAAAAwAQCdASoBAAEAAQAcJaQAA3AA/v3AgAA=';
    
    const result = await analyzeImageWithFallback(minimalImageData);
    
    // Validate the result structure matches our types
    expect(result).toHaveProperty('skinAnalysis');
    expect(result).toHaveProperty('vto');
    expect(result).toHaveProperty('timestamp');
    expect(result).toHaveProperty('imageWidth');
    expect(result).toHaveProperty('imageHeight');
    
    // Validate skin analysis structure
    expect(result.skinAnalysis).toHaveProperty('healthScore');
    expect(result.skinAnalysis).toHaveProperty('spots');
    expect(result.skinAnalysis).toHaveProperty('texture');
    expect(result.skinAnalysis).toHaveProperty('redness');
    expect(result.skinAnalysis).toHaveProperty('safetyFlags');
    expect(result.skinAnalysis).toHaveProperty('barrierRepairRegimen');
    
    // Validate VTO structure
    expect(result.vto).toHaveProperty('recommendedLipShades');
    expect(result.vto).toHaveProperty('outfitPalette');
    expect(result.vto).toHaveProperty('description');
    
    // Validate arrays
    expect(Array.isArray(result.skinAnalysis.safetyFlags)).toBe(true);
    expect(Array.isArray(result.skinAnalysis.barrierRepairRegimen)).toBe(true);
    expect(Array.isArray(result.vto.recommendedLipShades)).toBe(true);
    
    // Validate lip shades array is not empty
    expect(result.vto.recommendedLipShades.length).toBeGreaterThan(0);
    
    // Validate outfit palette
    expect(result.vto.outfitPalette).toHaveProperty('primary');
    expect(result.vto.outfitPalette).toHaveProperty('secondary');
    expect(result.vto.outfitPalette).toHaveProperty('accent');
    expect(result.vto.outfitPalette).toHaveProperty('inspiration');
  });
});