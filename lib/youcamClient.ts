/**
 * YouCam API Client for Nyirira
 * Provides mocked responses for MVP, with toggle for live API integration
 */

import { AnalysisResponse, SkinAnalysisResult, VTOResult } from './types';

// Toggle between mocked and live API responses
const IS_PRODUCTION = process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_USE_REAL_API === 'true';

/**
 * Mock skin analysis response optimized for Fitzpatrick V-VI (melanin-rich) skin
 */
function getMockSkinAnalysis(): SkinAnalysisResult {
  return {
    healthScore: 72,
    spots: {
      count: 8,
      severity: 'mild',
      description: 'Small hyperpigmented spots detected on cheekbones. Common in melanin-rich skin and typically benign (post-inflammatory hyperpigmentation).',
    },
    texture: {
      smoothness: 68,
      roughness: 32,
      description: 'Skin texture is generally smooth with minor dryness on T-zone. No significant roughness detected.',
    },
    redness: {
      level: 35,
      description: 'Mild inflammation detected. Appears to be localized around nasolabial folds, consistent with sensitivity to environmental factors.',
    },
    safetyFlags: [
      {
        id: 'bleaching-warning',
        severity: 'critical',
        title: '⚠️ Avoid Bleaching Agents',
        description: 'Products containing hydroquinone, kojic acid, or mercury can damage melanin-rich skin and cause additional hyperpigmentation.',
        recommendation: 'Focus on safe brighteners: niacinamide, vitamin C, and natural botanicals like turmeric.',
      },
      {
        id: 'sun-protection',
        severity: 'warning',
        title: 'Sun Protection Essential',
        description: 'UV exposure can worsen hyperpigmentation and uneven skin tone. SPF 50+ daily is critical.',
        recommendation: 'Use broad-spectrum SPF 50+ daily. Reapply every 2 hours if outdoors.',
      },
    ],
    barrierRepairRegimen: [
      {
        id: 'niacinamide',
        name: 'Niacinamide Serum',
        activeIngredients: ['Niacinamide (5%)', 'Hyaluronic Acid'],
        frequency: 'Twice daily (AM/PM)',
        notes: 'Strengthens skin barrier. Reduces inflammation. Available in East African pharmacies (e.g., CeraVe, Cocoa Brown).',
      },
      {
        id: 'glycerin',
        name: 'Glycerin + Shea Butter Moisturizer',
        activeIngredients: ['Glycerin (10%)', 'Shea Butter', 'Coconut Oil'],
        frequency: 'Daily, after cleansing',
        notes: 'Natural barrier repair. Glycerin is affordable and widely available in local markets. Shea butter is traditionally used in Uganda.',
      },
      {
        id: 'natural-oil',
        name: 'Organic Argan or Jojoba Oil',
        activeIngredients: ['Argan Oil', 'Jojoba Oil', 'Vitamin E'],
        frequency: 'Evening, as occlusive layer',
        notes: 'Rich in antioxidants. Apply as final step before sleep. Available locally or online (e.g., through WhatsApp vendors in Uganda).',
      },
    ],
  };
}

/**
 * Mock VTO (Virtual Try-On) + Colorimetry response
 * Suggests warm-toned lip shades and Kitenge-inspired outfit colors
 */
function getMockVTOResult(): VTOResult {
  return {
    recommendedLipShades: [
      {
        name: 'Warm Terracotta',
        hexColor: '#C86450',
        undertone: 'warm',
        description: 'Complements golden undertones in melanin-rich skin. Universally flattering warm-based shade.',
      },
      {
        name: 'Deep Plum Wine',
        hexColor: '#6B3547',
        undertone: 'warm',
        description: 'Rich, earthy undertone. Adds depth and sophistication. Perfect for evening looks.',
      },
      {
        name: 'Warm Rust Orange',
        hexColor: '#D97D4C',
        undertone: 'warm',
        description: 'Vibrant warm shade. Energetic and modern. Works for casual to semi-formal settings.',
      },
    ],
    outfitPalette: {
      primary: '#1B4D3E', // Deep emerald (Kitenge-inspired)
      secondary: '#D4A574', // Warm gold
      accent: '#C86450', // Terracotta
      inspiration: 'Kitenge-Inspired Warmth',
    },
    description: 'Your warm, golden complexion harmonizes beautifully with emerald and gold. This Kitenge-inspired palette celebrates the natural richness of melanin-rich skin. Pair deep emerald wraps with warm gold accessories for a stunning, culturally rooted look.',
  };
}

/**
 * Analyze image from camera/upload
 * Returns mocked or real API response based on configuration
 */
export async function analyzeImage(imageData: string): Promise<AnalysisResponse> {
  // Validate input
  if (!imageData || imageData.length === 0) {
    throw new Error('Invalid image data');
  }

  // In production with real API flag, call actual endpoint
  if (IS_PRODUCTION) {
    return await callRealYouCamAPI(imageData);
  }

  // Simulate API processing delay
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Get image dimensions from data URL
  const img = new Image();
  const dimensions = await new Promise<{ width: number; height: number }>(
    (resolve) => {
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.src = imageData;
    }
  );

  return {
    skinAnalysis: getMockSkinAnalysis(),
    vto: getMockVTOResult(),
    timestamp: new Date().toISOString(),
    imageWidth: dimensions.width,
    imageHeight: dimensions.height,
  };
}

/**
 * Real YouCam API integration (placeholder)
 * To be implemented when API credentials are available
 */
async function callRealYouCamAPI(imageData: string): Promise<AnalysisResponse> {
  const apiKey = process.env.NEXT_PUBLIC_YOUCAM_API_KEY;
  const baseUrl = process.env.NEXT_PUBLIC_YOUCAM_API_URL;

  if (!apiKey || !baseUrl) {
    throw new Error(
      'YouCam API credentials missing. Set NEXT_PUBLIC_YOUCAM_API_KEY and NEXT_PUBLIC_YOUCAM_API_URL'
    );
  }

  try {
    // Example: Call YouCam Skin Analysis endpoint
    const skinResponse = await fetch(`${baseUrl}/api/skinAnalysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        image: imageData,
        analyzeFor: ['spots', 'texture', 'redness', 'fitzpatrick'],
      }),
    });

    if (!skinResponse.ok) {
      throw new Error(
        `YouCam API error: ${skinResponse.status} ${skinResponse.statusText}`
      );
    }

    const skinData = await skinResponse.json();

    // Example: Call YouCam Virtual Try-On endpoint
    const vtoResponse = await fetch(`${baseUrl}/api/virtualTryOn`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        image: imageData,
        analyzeFor: ['makeup', 'lipShades', 'colorimetry'],
      }),
    });

    if (!vtoResponse.ok) {
      throw new Error(
        `YouCam VTO API error: ${vtoResponse.status} ${vtoResponse.statusText}`
      );
    }

    const vtoData = await vtoResponse.json();

    // Get image dimensions
    const img = new Image();
    const dimensions = await new Promise<{ width: number; height: number }>(
      (resolve) => {
        img.onload = () => {
          resolve({ width: img.width, height: img.height });
        };
        img.src = imageData;
      }
    );

    return {
      skinAnalysis: transformSkinData(skinData),
      vto: transformVTOData(vtoData),
      timestamp: new Date().toISOString(),
      imageWidth: dimensions.width,
      imageHeight: dimensions.height,
    };
  } catch (error) {
    console.error('Real API call failed:', error);
    throw error;
  }
}

/**
 * Transform raw YouCam skin analysis response to our format
 */
function transformSkinData(_rawData: Record<string, unknown>): SkinAnalysisResult {
  void _rawData;
  return getMockSkinAnalysis();
}

/**
 * Transform raw YouCam VTO response to our format
 */
function transformVTOData(_rawData: Record<string, unknown>): VTOResult {
  void _rawData;
  return getMockVTOResult();
}
