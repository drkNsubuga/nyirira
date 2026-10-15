/**
 * Type definitions for Nyirira app
 * Covers YouCam API responses, analysis results, and UI state
 */

export interface SkinAnalysisResult {
  healthScore: number; // 0-100
  spots: {
    count: number;
    severity: 'mild' | 'moderate' | 'severe';
    description: string;
  };
  texture: {
    smoothness: number; // 0-100
    roughness: number; // 0-100
    description: string;
  };
  redness: {
    level: number; // 0-100
    description: string;
  };
  safetyFlags: SafetyFlag[];
  barrierRepairRegimen: BarrierRepairProduct[];
}

export interface SafetyFlag {
  id: string;
  severity: 'warning' | 'critical';
  title: string;
  description: string;
  recommendation: string;
}

export interface BarrierRepairProduct {
  id: string;
  name: string;
  activeIngredients: string[];
  frequency: string;
  notes: string;
}

export interface VTOResult {
  recommendedLipShades: LipShade[];
  outfitPalette: ColorPalette;
  description: string;
}

export interface LipShade {
  name: string;
  hexColor: string;
  undertone: 'warm' | 'cool' | 'neutral';
  description: string;
}

export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  inspiration: string; // e.g., "Kitenge-inspired"
}

export interface AnalysisResponse {
  skinAnalysis: SkinAnalysisResult;
  vto: VTOResult;
  timestamp: string;
  imageWidth: number;
  imageHeight: number;
}

export interface CameraError {
  type: 'permission-denied' | 'not-supported' | 'unknown';
  message: string;
}

export interface AppState {
  step: 'capture' | 'processing' | 'results';
  imageData: string | null;
  analysis: AnalysisResponse | null;
  error: string | null;
  errorList: string[] | null;
  isLoading: boolean;
  validationProgress: number;
  validationMessage: string;
  /** Overall scan progress (0-100) combining validation + API analysis phases. */
  scanProgress: number;
}
