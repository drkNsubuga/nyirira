/**
 * YouCam API Client for Nyirira
 * Provides mocked responses for MVP, with toggle for live API integration
 */

import { getAppSettings } from './storage';
import { AnalysisResponse, SkinAnalysisResult, VTOResult } from './types';

const ENV_REAL_API_ENABLED = process.env.NEXT_PUBLIC_USE_REAL_API === 'true';

export function shouldUseRealApi(): boolean {
  if (typeof window !== 'undefined') {
    try {
      const settings = getAppSettings();
      if (settings.useRealAPI) {
        return true;
      }
    } catch {
      // Ignore storage access issues and fall back to env config below.
    }
  }

  return ENV_REAL_API_ENABLED;
}

const ZERO_DIMENSIONS = { width: 0, height: 0 };

/**
 * Read the intrinsic pixel dimensions of an image from a data URI.
 *
 * In a real browser `onload`/`onerror` fire almost immediately. In test
 * environments (jsdom) images are not actually decoded, so neither event is
 * guaranteed to fire — we race against a short timeout and fall back to
 * (0, 0) so callers never hang.
 */
function getImageDimensions(
  imageData: string,
  timeoutMs = 1000
): Promise<{ width: number; height: number }> {
  return new Promise((resolveDimensions) => {
    if (typeof Image === 'undefined') {
      resolveDimensions(ZERO_DIMENSIONS);
      return;
    }

    const img = new Image();
    let settled = false;

    const settle = (value: { width: number; height: number }) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolveDimensions(value);
    };

    const timer = setTimeout(() => settle(ZERO_DIMENSIONS), timeoutMs);

    img.onload = () => settle({ width: img.width, height: img.height });
    img.onerror = () => settle(ZERO_DIMENSIONS);
    img.src = imageData;
  });
}

function getMockAnalysis(imageData: string): Promise<AnalysisResponse> {
  return new Promise(async (resolve, reject) => {
    try {
      const dimensions = await getImageDimensions(imageData);

      resolve({
        skinAnalysis: getMockSkinAnalysis(),
        vto: getMockVTOResult(),
        timestamp: new Date().toISOString(),
        imageWidth: dimensions.width,
        imageHeight: dimensions.height,
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Mock skin analysis response optimized for Fitzpatrick V-VI (melanin-rich) skin
 */
function getMockSkinAnalysis(): SkinAnalysisResult {
  return {
    healthScore: 72,
    spots: {
      count: 8,
      severity: 'mild',
      description:
        'Small hyperpigmented spots detected on cheekbones. Common in melanin-rich skin and typically benign (post-inflammatory hyperpigmentation).',
    },
    texture: {
      smoothness: 68,
      roughness: 32,
      description:
        'Skin texture is generally smooth with minor dryness on T-zone. No significant roughness detected.',
    },
    redness: {
      level: 35,
      description:
        'Mild inflammation detected. Appears to be localized around nasolabial folds, consistent with sensitivity to environmental factors.',
    },
    safetyFlags: [
      {
        id: 'bleaching-warning',
        severity: 'critical',
        title: '⚠️ Avoid Bleaching Agents',
        description:
          'Products containing hydroquinone, kojic acid, or mercury can damage melanin-rich skin and cause additional hyperpigmentation.',
        recommendation:
          'Focus on safe brighteners: niacinamide, vitamin C, and natural botanicals like turmeric.',
      },
      {
        id: 'sun-protection',
        severity: 'warning',
        title: 'Sun Protection Essential',
        description:
          'UV exposure can worsen hyperpigmentation and uneven skin tone. SPF 50+ daily is critical.',
        recommendation: 'Use broad-spectrum SPF 50+ daily. Reapply every 2 hours if outdoors.',
      },
    ],
    barrierRepairRegimen: [
      {
        id: 'niacinamide',
        name: 'Niacinamide Serum',
        activeIngredients: ['Niacinamide (5%)', 'Hyaluronic Acid'],
        frequency: 'Twice daily (AM/PM)',
        notes:
          'Strengthens skin barrier. Reduces inflammation. Available in East African pharmacies (e.g., CeraVe, Cocoa Brown).',
      },
      {
        id: 'glycerin',
        name: 'Glycerin + Shea Butter Moisturizer',
        activeIngredients: ['Glycerin (10%)', 'Shea Butter', 'Coconut Oil'],
        frequency: 'Daily, after cleansing',
        notes:
          'Natural barrier repair. Glycerin is affordable and widely available in local markets. Shea butter is traditionally used in Uganda.',
      },
      {
        id: 'natural-oil',
        name: 'Organic Argan or Jojoba Oil',
        activeIngredients: ['Argan Oil', 'Jojoba Oil', 'Vitamin E'],
        frequency: 'Evening, as occlusive layer',
        notes:
          'Rich in antioxidants. Apply as final step before sleep. Available locally or online (e.g., through WhatsApp vendors in Uganda).',
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
        description:
          'Complements golden undertones in melanin-rich skin. Universally flattering warm-based shade.',
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
        description:
          'Vibrant warm shade. Energetic and modern. Works for casual to semi-formal settings.',
      },
    ],
    outfitPalette: {
      primary: '#1B4D3E', // Deep emerald (Kitenge-inspired)
      secondary: '#D4A574', // Warm gold
      accent: '#C86450', // Terracotta
      inspiration: 'Kitenge-Inspired Warmth',
    },
    description:
      'Your warm, golden complexion harmonizes beautifully with emerald and gold. This Kitenge-inspired palette celebrates the natural richness of melanin-rich skin. Pair deep emerald wraps with warm gold accessories for a stunning, culturally rooted look.',
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
  if (shouldUseRealApi()) {
    try {
      return await callRealYouCamAPI(imageData);
    } catch (error) {
      console.warn('Real API analysis failed, falling back to mocked results.', error);
    }
  }

  // Simulate API processing delay
  await new Promise((resolve) => setTimeout(resolve, 2000));

  return await getMockAnalysis(imageData);
}

async function fetchWithRetry(url: string, init: RequestInit, maxRetries = 2): Promise<Response> {
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      const response = await fetch(url, init);
      if (response.ok || attempt >= maxRetries) {
        return response;
      }
    } catch (error) {
      if (attempt >= maxRetries) {
        throw error;
      }
    }

    const delayMs = 500 * (attempt + 1);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    attempt += 1;
  }

  throw new Error('YouCam request failed after retries');
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
    const skinResponse = await fetchWithRetry(`${baseUrl}/api/skinAnalysis`, {
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
      throw new Error(`YouCam API error: ${skinResponse.status} ${skinResponse.statusText}`);
    }

    const skinData = await skinResponse.json();

    const vtoResponse = await fetchWithRetry(`${baseUrl}/api/virtualTryOn`, {
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
      throw new Error(`YouCam VTO API error: ${vtoResponse.status} ${vtoResponse.statusText}`);
    }

    const vtoData = await vtoResponse.json();

    const dimensions = await getImageDimensions(imageData);

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
function transformSkinData(rawData: Record<string, unknown>): SkinAnalysisResult {
  const fallback = getMockSkinAnalysis();
  if (!rawData || typeof rawData !== 'object') {
    return fallback;
  }

  const healthScore = Number(rawData.healthScore ?? fallback.healthScore);
  const spots = rawData.spots as Record<string, unknown> | undefined;
  const texture = rawData.texture as Record<string, unknown> | undefined;
  const redness = rawData.redness as Record<string, unknown> | undefined;
  const safetyFlags = Array.isArray(rawData.safetyFlags) ? rawData.safetyFlags : fallback.safetyFlags;
  const barrierRepairRegimen = Array.isArray(rawData.barrierRepairRegimen)
    ? rawData.barrierRepairRegimen
    : fallback.barrierRepairRegimen;

  return {
    healthScore: Number.isFinite(healthScore) ? healthScore : fallback.healthScore,
    spots: {
      count: Number(spots?.count ?? fallback.spots.count),
      severity: (spots?.severity as 'mild' | 'moderate' | 'severe') ?? fallback.spots.severity,
      description: String(spots?.description ?? fallback.spots.description),
    },
    texture: {
      smoothness: Number(texture?.smoothness ?? fallback.texture.smoothness),
      roughness: Number(texture?.roughness ?? fallback.texture.roughness),
      description: String(texture?.description ?? fallback.texture.description),
    },
    redness: {
      level: Number(redness?.level ?? fallback.redness.level),
      description: String(redness?.description ?? fallback.redness.description),
    },
    safetyFlags: safetyFlags as SkinAnalysisResult['safetyFlags'],
    barrierRepairRegimen: barrierRepairRegimen as SkinAnalysisResult['barrierRepairRegimen'],
  };
}

/**
 * Transform raw YouCam VTO response to our format
 */
function transformVTOData(rawData: Record<string, unknown>): VTOResult {
  const fallback = getMockVTOResult();
  if (!rawData || typeof rawData !== 'object') {
    return fallback;
  }

  const recommendedLipShades = Array.isArray(rawData.recommendedLipShades)
    ? rawData.recommendedLipShades
    : fallback.recommendedLipShades;
  const outfitPalette = (rawData.outfitPalette as Record<string, unknown>) ?? fallback.outfitPalette;

  return {
    recommendedLipShades: recommendedLipShades as VTOResult['recommendedLipShades'],
    outfitPalette: {
      primary: String(outfitPalette.primary ?? fallback.outfitPalette.primary),
      secondary: String(outfitPalette.secondary ?? fallback.outfitPalette.secondary),
      accent: String(outfitPalette.accent ?? fallback.outfitPalette.accent),
      inspiration: String(outfitPalette.inspiration ?? fallback.outfitPalette.inspiration),
    },
    description: String(rawData.description ?? fallback.description),
  };
}
