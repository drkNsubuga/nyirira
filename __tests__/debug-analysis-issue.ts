/**
 * Debug test for the "unusable analysis" issue
 */

import { AnalysisResponse } from '@/lib/types';

// Replicate the hasCompleteAnalysis function from page.tsx
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

describe('Analysis Issue Debug', () => {
  it('should test mock data completeness', () => {
    // Mock data structure from getMockAnalysis
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

    console.log('Testing mock data with hasCompleteAnalysis...');
    
    const isComplete = hasCompleteAnalysis(mockData);
    console.log('isComplete result:', isComplete);
    
    expect(isComplete).toBe(true);
  });

  it('should test incomplete data scenario', () => {
    // Test what happens when data is incomplete
    const incompleteData: AnalysisResponse = {
      skinAnalysis: {
        healthScore: undefined as unknown as number,
        spots: { count: 0, severity: 'mild' as const, description: '' },
        texture: { smoothness: 0, roughness: 0, description: '' },
        redness: { level: 0, description: '' },
        safetyFlags: [],
        barrierRepairRegimen: []
      },
      vto: {
        recommendedLipShades: [],
        outfitPalette: { primary: '', secondary: '', accent: '', inspiration: '' },
        description: ''
      },
      timestamp: new Date().toISOString(),
      imageWidth: 0,
      imageHeight: 0,
    };

    const isComplete = hasCompleteAnalysis(incompleteData);
    console.log('Incomplete data result:', isComplete);
    expect(isComplete).toBe(false);
  });

  it('should test real API scenario with missing lip shades', () => {
    // Simulate what might happen if real API returns empty lip shades
    const realApiData: AnalysisResponse = {
      skinAnalysis: {
        healthScore: 75,
        spots: { count: 5, severity: 'moderate', description: 'Some spots' },
        texture: { smoothness: 70, roughness: 30, description: 'Good texture' },
        redness: { level: 40, description: 'Mild redness' },
        safetyFlags: [],
        barrierRepairRegimen: []
      },
      vto: {
        recommendedLipShades: [],
        outfitPalette: { primary: '#FF0000', secondary: '#00FF00', accent: '#0000FF', inspiration: 'Test' },
        description: 'Test description'
      },
      timestamp: new Date().toISOString(),
      imageWidth: 800,
      imageHeight: 600,
    };

    const isComplete = hasCompleteAnalysis(realApiData);
    console.log('Real API data (empty lip shades) result:', isComplete);
    expect(isComplete).toBe(false);
  });
});