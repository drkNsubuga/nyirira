/**
 * YouCam API Client for Nyirira
 * Provides mocked responses for MVP, with toggle for live API integration
 */

import { getAppSettings } from './storage';
import { buildBarrierRepairRegimen, buildSafetyFlags, SkinSnapshot } from './recommendations';
import { AnalysisResponse, SkinAnalysisResult, SkinConcernMask, VTOResult } from './types';

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

/**
 * Presence-only snapshot of the live-API config (values are never exposed).
 * Used to build actionable error messages — e.g. on Cloudflare Pages where
 * NEXT_PUBLIC_* vars only take effect if they exist in the BUILD environment
 * of the deployment being served.
 */
export function describeYouCamEnv(): {
  useRealApi: boolean;
  hasApiKey: boolean;
  hasApiUrl: boolean;
} {
  return {
    useRealApi: shouldUseRealApi(),
    hasApiKey: Boolean(process.env.NEXT_PUBLIC_YOUCAM_API_KEY),
    hasApiUrl: Boolean(process.env.NEXT_PUBLIC_YOUCAM_API_URL),
  };
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
  const skin: SkinSnapshot = {
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
  };

  // The mock measurements and the guidance derived from them stay in sync —
  // same builder functions the live path uses (lib/recommendations.ts).
  return {
    ...skin,
    safetyFlags: buildSafetyFlags(skin),
    barrierRepairRegimen: buildBarrierRepairRegimen(skin),
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
const MAKEUP_VTO_TASK_PATH = '/s2s/v2.0/task/makeup-vto';
const FILE_UPLOAD_PATH = '/s2s/v2.0/file';

/**
 * Cache the last uploaded file_id so the Harmonized Look tab can trigger
 * per-shade makeup VTO without re-uploading the image.
 * Cleared on each new analyzeImage call.
 */
let _lastFileId: string | null = null;
export function getLastFileId(): string | null { return _lastFileId; }
export function clearLastFileId(): void { _lastFileId = null; }

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

/**
 * Apply a specific lip shade via the Makeup VTO API.
 * Uses the uploaded file_id (already on YouCam servers) to avoid re-uploading.
 * Returns the rendered image URL or null on failure.
 *
 * API: POST /s2s/v2.0/task/makeup-vto
 * Docs: https://docs.perfectcorp.com/reference/description/ai_makeup_vto.md
 */
export async function applyMakeupVTO(
  fileId: string,
  hexColor: string
): Promise<string | null> {
  const apiKey = process.env.NEXT_PUBLIC_YOUCAM_API_KEY;
  const baseUrl = process.env.NEXT_PUBLIC_YOUCAM_API_URL;
  if (!apiKey || !baseUrl) return null;

  try {
    const taskId = await startTask(baseUrl, apiKey, MAKEUP_VTO_TASK_PATH, {
      src_file_id: fileId,
      version: '1.0',
      effects: [
        {
          category: 'lip_color',
          shape: { name: 'original' },
          style: { type: 'full' },
          palettes: [
            {
              color: hexColor,
              texture: 'matte',
              colorIntensity: 75,
            },
          ],
        },
      ],
    });

    const result = await pollTask(
      baseUrl,
      apiKey,
      MAKEUP_VTO_TASK_PATH,
      taskId,
      1500,
      30
    );

    // Success payload: { results: { url: string } } or { results: [{ download_url }] }
    const url =
      typeof (result.results as Record<string, unknown>)?.url === 'string'
        ? ((result.results as Record<string, unknown>).url as string)
        : Array.isArray(result.results)
          ? ((result.results as Array<Record<string, unknown>>)[0]?.download_url as string | undefined)
          : undefined;

    return url ?? null;
  } catch {
    return null;
  }
}
async function callRealYouCamAPI(imageData: string): Promise<AnalysisResponse> {
  const apiKey = process.env.NEXT_PUBLIC_YOUCAM_API_KEY;
  const baseUrl = process.env.NEXT_PUBLIC_YOUCAM_API_URL;

  if (!apiKey || !baseUrl) {
    const missing = [
      !apiKey && 'NEXT_PUBLIC_YOUCAM_API_KEY',
      !baseUrl && 'NEXT_PUBLIC_YOUCAM_API_URL',
    ]
      .filter(Boolean)
      .join(' and ');
    throw new Error(
      `YouCam API credentials missing: ${missing}. ` +
        'NEXT_PUBLIC_* values are baked into the bundle at BUILD time. ' +
        'On Cloudflare Pages: set them under Settings → Environment variables for ' +
        'the environment you are deploying (Production AND Preview), then REDEPLOY — ' +
        'vars added after the last build, or in wrangler.toml [vars], are not picked ' +
        'up by this static export. Note: the Settings → "Use live API" toggle can ' +
        'also enable live mode per-browser even when no env vars were built in.'
    );
  }

  try {
    // Upload the image once; both tasks can reference the same file_id.
    // Cache it so the dashboard can trigger per-shade makeup VTO later.
    clearLastFileId();
    const fileId = await uploadImageFile(baseUrl, apiKey, imageData);
    _lastFileId = fileId;

    // Look VTO requires a template_id — grab the first available template.
    const templateId = await getFirstLookVtoTemplate(baseUrl, apiKey);

    // Start skin-analysis and look-vto tasks in parallel.
    const [skinTaskId, vtoTaskId] = await Promise.all([
      startTask(baseUrl, apiKey, SKIN_ANALYSIS_TASK_PATH, {
        src_file_id: fileId,
        // SD actions relevant to Nyirira: spots, texture, redness, radiance.
        dst_actions: ['age_spot', 'texture', 'redness', 'radiance'],
        // Request individual mask_urls per concern (not a blended overlay).
        // Each output entry will include mask_urls: [presignedUrl] for overlay.
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
 * Map the live YouCam v2 skin-analysis payload to our dashboard format.
 *
 * The real task success payload is `results.output[]` — a list of
 * `{ type, ui_score, raw_score }` entries (redness, radiance, texture,
 * age_spot, plus skin_age/all/resize_image). `ui_score` is Perfect Corp's
 * consumer-facing 0–100 score where HIGHER = better condition (their docs:
 * ui_score is calibrated to "lean positive" and is the recommended choice for
 * consumer experiences).
 *
 * NOTE: Runs only on the live-API path. When a type is missing the field falls
 * back to a neutral value, and `hasCompleteAnalysis()` rejects an all-zero
 * response with a friendly error instead of rendering an empty dashboard.
 * Mock scores are only returned when USE_REAL_API is disabled.
 */
export function transformSkinData(rawData: Record<string, unknown>): SkinAnalysisResult {
  const output = Array.isArray(rawData?.output)
    ? (rawData.output as Array<Record<string, unknown> | null>).filter(
        (entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === 'object',
      )
    : [];

  if (output.length > 0) {
    const uiScore = (type: string): number | null => {
      const entry = output.find((e) => e.type === type);
      const value = Number(entry?.ui_score);
      if (!Number.isFinite(value)) return null;
      return Math.max(0, Math.min(100, value));
    };

    const rednessQuality = uiScore('redness'); // higher = calmer skin
    const textureQuality = uiScore('texture'); // higher = smoother skin
    const radianceQuality = uiScore('radiance'); // higher = more radiant
    const pigmentationQuality = uiScore('age_spot'); // higher = fewer visible spots

    const scores = [rednessQuality, textureQuality, radianceQuality, pigmentationQuality].filter(
      (value): value is number => value !== null,
    );
    const healthScore =
      scores.length > 0
        ? Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length)
        : 0;

    const severity: 'mild' | 'moderate' | 'severe' =
      pigmentationQuality === null
        ? 'mild'
        : pigmentationQuality >= 80
          ? 'mild'
          : pigmentationQuality >= 60
            ? 'moderate'
            : 'severe';

    // The live API reports pigmentation as a quality score, not a spot count —
    // `count` stays 0 and the card renders "—" instead of a fabricated number.
    const spotsDescription =
      pigmentationQuality === null
        ? ''
        : severity === 'mild'
          ? `Minimal visible pigmentation — age-spot score ${pigmentationQuality}/100. Common post-inflammatory marks in melanin-rich skin are typically benign.`
          : severity === 'moderate'
            ? `Noticeable hyperpigmentation in several areas — age-spot score ${pigmentationQuality}/100. Consistent with post-inflammatory hyperpigmentation, common in melanin-rich skin.`
            : `Widespread visible pigmentation — age-spot score ${pigmentationQuality}/100. Daily SPF plus a gentle brightening routine (niacinamide, vitamin C) is recommended.`;

    const textureDescription =
      textureQuality === null
        ? ''
        : textureQuality >= 80
          ? `Smooth, even texture — score ${textureQuality}/100 with minimal visible pores.`
          : textureQuality >= 60
            ? `Generally even texture — score ${textureQuality}/100 with some unevenness in the T-zone.`
            : `Rough or uneven texture — score ${textureQuality}/100. Gentle exfoliation 1–2× weekly can help.`;

    const rednessLevel = rednessQuality === null ? 0 : Math.round(100 - rednessQuality);
    const rednessDescription =
      rednessQuality === null
        ? ''
        : rednessLevel <= 20
          ? `Calm skin with little visible redness (score ${rednessQuality}/100).`
          : rednessLevel <= 50
            ? `Mild, localized redness (${rednessLevel}%). Often triggered by weather or product sensitivity.`
            : `Elevated redness (${rednessLevel}%). Look for fragrance-free, barrier-supporting products.`;

    // Safety advice + regimen are Nyirira's curated content, derived from
    // these very scores (lib/recommendations.ts) so the guidance adapts to
    // what the scan found instead of repeating static text.
    const skin: SkinSnapshot = {
      healthScore,
      spots: { count: 0, severity, description: spotsDescription },
      texture: {
        smoothness: textureQuality ?? 0,
        roughness: textureQuality === null ? 0 : Math.round(100 - textureQuality),
        description: textureDescription,
      },
      redness: { level: rednessLevel, description: rednessDescription },
    };

    // Capture per-concern mask URLs from the API response for overlay rendering.
    const concernMasks: SkinConcernMask[] = output
      .filter((e) => Array.isArray(e.mask_urls) && (e.mask_urls as string[]).length > 0)
      .map((e) => ({
        type: String(e.type),
        ui_score: Number(e.ui_score) || 0,
        maskUrls: (e.mask_urls as string[]).filter((u): u is string => typeof u === 'string'),
      }));

    return {
      ...skin,
      safetyFlags: buildSafetyFlags(skin),
      barrierRepairRegimen: buildBarrierRepairRegimen(skin),
      ...(concernMasks.length > 0 ? { concernMasks } : {}),
    };
  }

  // Legacy/pre-shaped payloads that already use our own field names.
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
 * Map the live look-vto payload to our format.
 *
 * The real success payload only contains `{ url }` — the rendered virtual
 * try-on image — no colors. The palette/lip shades are Nyirira's curated
 * style guidance (app content shared with the mock path — recommendations,
 * not measured data); the live image is exposed via `tryOnImageUrl`.
 */
export function transformVTOData(rawData: Record<string, unknown>): VTOResult {
  const url = typeof rawData?.url === 'string' ? rawData.url : '';
  const tryOnImageUrl = /^https?:\/\//.test(url) ? url : undefined;

  // Pre-shaped payloads (already our field names) pass through unchanged —
  // including intentionally empty palette/shades from callers.
  if (Array.isArray(rawData?.recommendedLipShades) || rawData?.outfitPalette) {
    const outfitPalette = (rawData?.outfitPalette as Record<string, unknown>) ?? {};
    return {
      recommendedLipShades: (Array.isArray(rawData?.recommendedLipShades)
        ? rawData.recommendedLipShades
        : []) as VTOResult['recommendedLipShades'],
      outfitPalette: {
        primary: String(outfitPalette.primary ?? ''),
        secondary: String(outfitPalette.secondary ?? ''),
        accent: String(outfitPalette.accent ?? ''),
        inspiration: String(outfitPalette.inspiration ?? ''),
      },
      description: String(rawData?.description ?? ''),
      ...(tryOnImageUrl ? { tryOnImageUrl } : {}),
    };
  }

  // Live look-vto payload is just { url } → curated style + the live image.
  const curated = getMockVTOResult();
  return {
    ...curated,
    ...(tryOnImageUrl ? { tryOnImageUrl } : {}),
    description: tryOnImageUrl
      ? `${curated.description} Your live virtual try-on look is shown above.`
      : curated.description,
  };
}
