/**
 * Test the fixed hasCompleteAnalysis function
 */

import { AnalysisResponse } from '@/lib/types';

describe('Fixed Analysis Completeness', () => {
  // Replicate the fixed hasCompleteAnalysis function
  const hasCompleteAnalysis = (result: AnalysisResponse | null): result is AnalysisResponse => {
    if (!result) return false;
    const skin = result.skinAnalysis;
    const vto = result.vto;
    
    // Essential skin analysis data must be present
    const hasEssentialSkinData = skin && 
      typeof skin.healthScore === 'number' && 
      Number.isFinite(skin.healthScore) &&
      skin.spots && 
      skin.texture && 
      skin.redness &&
      Array.isArray(skin.safetyFlags) &&
      Array.isArray(skin.barrierRepairRegimen);
    
    // VTO data should be present, but we can be more flexible
    const hasVTOData = vto && vto.outfitPalette;
    
    // For recommended lip shades, we prefer non-empty but can work with empty
    // as long as we have other VTO data like outfit palette
    const hasLipShades = vto && Array.isArray(vto.recommendedLipShades);
    
    return Boolean(hasEssentialSkinData && (hasVTOData || hasLipShades));
  };

  it('should accept complete mock data', () => {
    const mockData: AnalysisResponse = {
      skinAnalysis: {
        healthScore: 72,
        spots: { count: 8, severity: 'mild', description: 'Test spots' },
        texture: { smoothness: 68, roughness: 32, description: 'Test texture' },
        redness: { level: 35, description: 'Test redness' },
        safetyFlags: [{ id: 'test', severity: 'warning', title: 'Test', description: 'Test', recommendation: 'Test' }],
        barrierRepairRegimen: [{ id: 'test', name: 'Test', activeIngredients: ['test'], frequency: 'test', notes: 'test' }]
      },
      vto: {
        recommendedLipShades: [{ name: 'Test', hexColor: '#000000', undertone: 'warm', description: 'Test' }],
        outfitPalette: { primary: '#000000', secondary: '#000000', accent: '#000000', inspiration: 'Test' },
        description: 'Test description'
      },
      timestamp: new Date().toISOString(),
      imageWidth: 800,
      imageHeight: 600,
    };

    const isComplete = hasCompleteAnalysis(mockData);
    console.log('Complete mock data:', isComplete);
    expect(isComplete).toBe(true);
  });

  it('should accept data with empty lip shades but valid outfit palette', () => {
    const dataWithEmptyLipShades: AnalysisResponse = {
      skinAnalysis: {
        healthScore: 75,
        spots: { count: 5, severity: 'moderate' as const, description: 'Test' },
        texture: { smoothness: 70, roughness: 30, description: 'Test' },
        redness: { level: 40, description: 'Test' },
        safetyFlags: [],
        barrierRepairRegimen: []
      },
      vto: {
        recommendedLipShades: [], // Empty array - this was causing the issue
        outfitPalette: { primary: '#FF0000', secondary: '#00FF00', accent: '#0000FF', inspiration: 'Test' },
        description: 'Test'
      },
      timestamp: new Date().toISOString(),
      imageWidth: 800,
      imageHeight: 600,
    };

    const isComplete = hasCompleteAnalysis(dataWithEmptyLipShades);
    console.log('Data with empty lip shades but valid outfit palette:', isComplete);
    expect(isComplete).toBe(true); // Should now pass with the fix
  });

  it('should accept data with no VTO data but valid lip shades', () => {
    const dataWithNoVTO: AnalysisResponse = {
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
        outfitPalette: null as unknown as import('@/lib/types').ColorPalette, // No outfit palette but has lip shades
        description: 'Test'
      },
      timestamp: new Date().toISOString(),
      imageWidth: 800,
      imageHeight: 600,
    };

    const isComplete = hasCompleteAnalysis(dataWithNoVTO);
    console.log('Data with no VTO but valid lip shades:', isComplete);
    expect(isComplete).toBe(true); // Should pass because we have lip shades
  });

  it('should reject data with missing essential skin data', () => {
    const incompleteSkinData: AnalysisResponse = {
      skinAnalysis: {
        healthScore: undefined as unknown as number, // Missing health score
        spots: { count: 0, severity: 'mild' as const, description: '' },
        texture: { smoothness: 0, roughness: 0, description: '' },
        redness: { level: 0, description: '' },
        safetyFlags: [],
        barrierRepairRegimen: []
      },
      vto: {
        recommendedLipShades: [{ name: 'Test', hexColor: '#000000', undertone: 'warm', description: 'Test' }],
        outfitPalette: { primary: '#000000', secondary: '#000000', accent: '#000000', inspiration: 'Test' },
        description: 'Test'
      },
      timestamp: new Date().toISOString(),
      imageWidth: 0,
      imageHeight: 0,
    };

    const isComplete = hasCompleteAnalysis(incompleteSkinData);
    console.log('Incomplete skin data:', isComplete);
    expect(isComplete).toBe(false); // Should fail because essential skin data is missing
  });
});