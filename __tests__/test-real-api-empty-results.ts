/**
 * Test scenarios for when real API returns empty/incomplete results
 */

import { transformVTOData } from '@/lib/youcamClient';
import { AnalysisResponse } from '@/lib/types';

describe('Real API Empty Results Scenarios', () => {
  it('should handle empty VTO data from real API', () => {
    const emptyVTOData = {
      recommendedLipShades: [],
      outfitPalette: {},
      description: ''
    };

    const transformedVTO = transformVTOData(emptyVTOData);
    
    console.log('Empty VTO data result:', {
      lipShadesCount: transformedVTO.recommendedLipShades.length,
      hasOutfitPalette: !!transformedVTO.outfitPalette.primary
    });

    expect(transformedVTO.recommendedLipShades.length).toBe(0);
    expect(transformedVTO.outfitPalette.primary).toBe('');
  });

  it('should test hasCompleteAnalysis with empty lip shades', () => {
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

    const case1: AnalysisResponse = {
      skinAnalysis: {
        healthScore: 75,
        spots: { count: 5, severity: 'moderate' as const, description: 'Test' },
        texture: { smoothness: 70, roughness: 30, description: 'Test' },
        redness: { level: 40, description: 'Test' },
        safetyFlags: [],
        barrierRepairRegimen: []
      },
      vto: {
        recommendedLipShades: [], // Empty array - this causes the "no usable results" issue
        outfitPalette: { primary: '#FF0000', secondary: '#00FF00', accent: '#0000FF', inspiration: 'Test' },
        description: 'Test'
      },
      timestamp: new Date().toISOString(),
      imageWidth: 800,
      imageHeight: 600,
    };

    console.log('Empty lip shades case:', hasCompleteAnalysis(case1));
    expect(hasCompleteAnalysis(case1)).toBe(false);
  });

  it('should test hasCompleteAnalysis with complete data', () => {
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

    const completeResult: AnalysisResponse = {
      skinAnalysis: {
        healthScore: 75,
        spots: { count: 5, severity: 'moderate' as const, description: 'Test' },
        texture: { smoothness: 70, roughness: 30, description: 'Test' },
        redness: { level: 40, description: 'Test' },
        safetyFlags: [{ id: 'test', severity: 'warning' as const, title: 'Test', description: 'Test', recommendation: 'Test' }],
        barrierRepairRegimen: [{ id: 'test', name: 'Test', activeIngredients: ['test'], frequency: 'test', notes: 'test' }]
      },
      vto: {
        recommendedLipShades: [{ name: 'Test', hexColor: '#FF0000', undertone: 'warm', description: 'Test' }],
        outfitPalette: { primary: '#FF0000', secondary: '#00FF00', accent: '#0000FF', inspiration: 'Test' },
        description: 'Test'
      },
      timestamp: new Date().toISOString(),
      imageWidth: 800,
      imageHeight: 600,
    };

    console.log('Complete analysis result:', hasCompleteAnalysis(completeResult));
    expect(hasCompleteAnalysis(completeResult)).toBe(true);
  });
});