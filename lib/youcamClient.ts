/**
 * YouCam API Client for Nyirira
 * Provides mocked responses for MVP, with toggle for live API integration
 */

import { getAppSettings } from './storage';
import { AnalysisResponse, SkinAnalysisResult, VTOResult } from './types';

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

  // Read env dynamically (Next.js inlines NEXT_PUBLIC_* as literals in the
  // browser bundle; tests can flip this at runtime).
  return process.env.NEXT_PUBLIC_USE_REAL_API === 'true';
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
 * Automatically falls back to mock analysis if live API fails
 */
export async function analyzeImage(imageData: string): Promise<AnalysisResponse> {
  // Validate input
  if (!imageData || imageData.length === 0) {
    throw new Error('Invalid image data');
  }

  // Use the fallback function which handles both real API and mock
  return analyzeImageWithFallback(imageData);
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

    // True exponential backoff: 500ms, 1000ms, 2000ms... (SRS FR5.3).
    const delayMs = 500 * 2 ** attempt;
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    attempt += 1;
  }

  throw new Error('YouCam request failed after retries');
}

/**
 * Real YouCam (Perfect Corp) API integration.
 *
 * Uses the async task workflow documented at:
 * - https://docs.perfectcorp.com/reference/ai_skin_analysis
 * - https://docs.perfectcorp.com/reference/ai_look_vto
 *
 * Flow: upload image via File API → create task → poll until complete.
 */
const SKIN_ANALYSIS_TASK_PATH = '/s2s/v2.0/task/skin-analysis';
const LOOK_VTO_TASK_PATH = '/s2s/v2.0/task/look-vto';
const FILE_UPLOAD_PATH = '/s2s/v2.0/file';

function dataUriToBlob(dataUri: string): Blob {
  const [header, base64] = dataUri.split(',');
  const mime = header.match(/data:(.*?);/)?.[1] ?? 'image/jpeg';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

/** Step 1: Upload image via Perfect Corp File API, return file_id. */
async function uploadImageFile(baseUrl: string, apiKey: string, imageData: string): Promise<string> {
  const blob = dataUriToBlob(imageData);
  const fileName = `skin_${Date.now()}.jpg`;
  const contentType = blob.type || 'image/jpeg';

  // Initialise file upload — server returns file_id + upload_url.
  const initRes = await fetchWithRetry(`${baseUrl}${FILE_UPLOAD_PATH}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      files: [{ content_type: contentType, file_name: fileName, file_size: blob.size }],
    }),
  });
  if (!initRes.ok) {
    const detail = await initRes.text().catch(() => '');
    throw new Error(`File init failed: ${initRes.status} ${initRes.statusText} ${detail}`);
  }
  const initData = await initRes.json();
  // Response shape: { status, data: { files: [{ file_id, requests: [{ method, url, headers }] }] } }
  const fileEntry = initData?.data?.files?.[0] ?? initData?.files?.[0];
  const fileId: string | undefined = fileEntry?.file_id;
  // requests is an ARRAY: [{ method: 'PUT', url: presignedUrl, headers }]
  const request = Array.isArray(fileEntry?.requests) ? fileEntry.requests[0] : undefined;
  const uploadUrl: string | undefined = request?.url ?? fileEntry?.upload_url;
  const uploadMethod: string = request?.method ?? 'PUT';
  if (!fileId) throw new Error('file_id missing from file init response');
  if (!uploadUrl) {
    throw new Error(`upload URL missing from file init response: ${JSON.stringify(initData)}`);
  }

  // Upload raw bytes to the presigned URL — without this the file_id points
  // at an empty object and downstream tasks fail with 403.
  const putRes = await fetch(uploadUrl, {
    method: uploadMethod,
    body: blob,
    headers: { 'Content-Type': contentType },
  });
  if (!putRes.ok) {
    const detail = await putRes.text().catch(() => '');
    throw new Error(`File upload failed: ${putRes.status} ${putRes.statusText} ${detail}`);
  }

  return fileId;
}

/** Fetch the first available look-vto template id (required by the task API). */
async function getFirstLookVtoTemplate(baseUrl: string, apiKey: string): Promise<string> {
  const res = await fetchWithRetry(`${baseUrl}/s2s/v2.0/task/template/look-vto?page_size=1`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) {
    throw new Error(`Template list failed: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  const templates = data?.templates ?? data?.data?.templates ?? [];
  const templateId: string | undefined = templates[0]?.template_id ?? templates[0]?.id;
  if (!templateId) throw new Error('No look-vto templates available');
  return templateId;
}

/** Step 2: Create a task (skin-analysis or look-vto), return task_id. */
async function startTask(baseUrl: string, apiKey: string, taskPath: string, body: Record<string, unknown>): Promise<string> {
  const res = await fetchWithRetry(`${baseUrl}${taskPath}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Task start failed: ${res.status} ${res.statusText} ${detail}`);
  }
  const data = await res.json();
  const taskId: string | undefined = data?.data?.task_id;
  if (!taskId) throw new Error('task_id missing from task response');
  return taskId;
}

/** Step 3: Poll task until success/error. */
async function pollTask(
  baseUrl: string,
  apiKey: string,
  taskPath: string,
  taskId: string,
  intervalMs = 2000,
  maxAttempts = 60
): Promise<Record<string, unknown>> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const res = await fetch(`${baseUrl}${taskPath}/${taskId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) {
      throw new Error(`Task poll failed: ${res.status} ${res.statusText}`);
    }
    const payload = await res.json();
    const status = payload?.data?.task_status;
    if (status === 'success') return payload?.data;
    if (status === 'error') throw new Error(`Task failed: ${JSON.stringify(payload)}`);
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  throw new Error('Task polling timed out');
}

async function callRealYouCamAPI(imageData: string): Promise<AnalysisResponse> {
  const apiKey = process.env.NEXT_PUBLIC_YOUCAM_API_KEY;
  const baseUrl = process.env.NEXT_PUBLIC_YOUCAM_API_URL;

  if (!apiKey || !baseUrl) {
    throw new Error(
      'YouCam API credentials missing. Set NEXT_PUBLIC_YOUCAM_API_KEY and NEXT_PUBLIC_YOUCAM_API_URL'
    );
  }

  try {
    // Upload the image once; both tasks can reference the same file_id.
    const fileId = await uploadImageFile(baseUrl, apiKey, imageData);

    // Look VTO requires a template_id — grab the first available template.
    const templateId = await getFirstLookVtoTemplate(baseUrl, apiKey);

    // Start skin-analysis and look-vto tasks in parallel.
    const [skinTaskId, vtoTaskId] = await Promise.all([
      startTask(baseUrl, apiKey, SKIN_ANALYSIS_TASK_PATH, {
        src_file_id: fileId,
        // SD actions relevant to Nyirira: spots, texture, redness, radiance.
        dst_actions: ['age_spot', 'texture', 'redness', 'radiance'],
        format: 'json',
      }),
      startTask(baseUrl, apiKey, LOOK_VTO_TASK_PATH, {
        src_file_id: fileId,
        template_id: templateId,
      }),
    ]);

    // Poll both tasks concurrently until each completes.
    const [skinTask, vtoTask] = await Promise.all([
      pollTask(baseUrl, apiKey, SKIN_ANALYSIS_TASK_PATH, skinTaskId),
      pollTask(baseUrl, apiKey, LOOK_VTO_TASK_PATH, vtoTaskId),
    ]);

    const skinData = (skinTask.results ?? skinTask) as Record<string, unknown>;
    const vtoData = (vtoTask.results ?? vtoTask) as Record<string, unknown>;

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
 * Analyze an image.
 *
 * When the live YouCam API is enabled, errors PROPAGATE so the UI can show
 * the user-facing error alert (friendly message + retry options).
 * Mock data is only used when the real API is not in use — a failed live
 * analysis must never be silently presented as real results.
 */
export async function analyzeImageWithFallback(imageData: string): Promise<AnalysisResponse> {
  if (shouldUseRealApi()) {
    // Errors intentionally bubble up — no silent fallback to mock data.
    return callRealYouCamAPI(imageData);
  }

  // Mock path (real API disabled): simulate processing delay (SRS NF1.3).
  await new Promise((resolve) => setTimeout(resolve, 2000));

  return getMockAnalysis(imageData);
}

/**
 * Transform raw YouCam skin analysis response to our format.
 *
 * NOTE: This runs only on the live-API path. When the real API omits a field we
 * use NEUTRAL defaults (empty / zero) — never fabricated mock scores. Mock data
 * must only ever be returned when USE_REAL_API is disabled.
 */
function transformSkinData(rawData: Record<string, unknown>): SkinAnalysisResult {
  const spots = rawData?.spots as Record<string, unknown> | undefined;
  const texture = rawData?.texture as Record<string, unknown> | undefined;
  const redness = rawData?.redness as Record<string, unknown> | undefined;
  const healthScore = Number(rawData?.healthScore);
  const safetyFlags = Array.isArray(rawData?.safetyFlags) ? rawData!.safetyFlags : [];
  const barrierRepairRegimen = Array.isArray(rawData?.barrierRepairRegimen)
    ? rawData!.barrierRepairRegimen
    : [];

  return {
    healthScore: Number.isFinite(healthScore) ? healthScore : 0,
    spots: {
      count: Number(spots?.count) || 0,
      severity: (spots?.severity as 'mild' | 'moderate' | 'severe') ?? 'mild',
      description: String(spots?.description ?? ''),
    },
    texture: {
      smoothness: Number(texture?.smoothness) || 0,
      roughness: Number(texture?.roughness) || 0,
      description: String(texture?.description ?? ''),
    },
    redness: {
      level: Number(redness?.level) || 0,
      description: String(redness?.description ?? ''),
    },
    safetyFlags: safetyFlags as SkinAnalysisResult['safetyFlags'],
    barrierRepairRegimen: barrierRepairRegimen as SkinAnalysisResult['barrierRepairRegimen'],
  };
}

/**
 * Transform raw YouCam VTO response to our format.
 *
 * NOTE: Runs only on the live-API path. Missing fields fall back to NEUTRAL
 * (empty palette / empty shade list), never fabricated mock recommendations.
 */
function transformVTOData(rawData: Record<string, unknown>): VTOResult {
  const outfitPalette = (rawData?.outfitPalette as Record<string, unknown>) ?? {};
  const recommendedLipShades = Array.isArray(rawData?.recommendedLipShades)
    ? rawData!.recommendedLipShades
    : [];

  return {
    recommendedLipShades: recommendedLipShades as VTOResult['recommendedLipShades'],
    outfitPalette: {
      primary: String(outfitPalette.primary ?? ''),
      secondary: String(outfitPalette.secondary ?? ''),
      accent: String(outfitPalette.accent ?? ''),
      inspiration: String(outfitPalette.inspiration ?? ''),
    },
    description: String(rawData?.description ?? ''),
  };
}
