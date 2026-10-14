/** Advanced image validation features.
 * Face detection, quality analysis, and privacy checks.
 */

import * as blazeface from '@tensorflow-models/blazeface';
import * as tf from '@tensorflow/tfjs';

/**
 * True when the browser reports no connectivity. Network-dependent ML checks
 * (blazeface / Tesseract download model weights + workers from a CDN) must be
 * skipped offline so validation never surfaces a raw "NetworkError".
 */
function isOffline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

/**
 * Load an image from a data URI with an onerror + timeout guard so callers
 * never hang or throw (jsdom and offline browsers never fire onload reliably).
 */
function loadImage(dataUri: string, timeoutMs = 2000): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (typeof Image === 'undefined' || typeof document === 'undefined') {
      resolve(null);
      return;
    }
    const img = new Image();
    let settled = false;
    const settle = (value: HTMLImageElement | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(value);
    };
    const timer = setTimeout(() => settle(null), timeoutMs);
    img.onload = () => settle(img);
    img.onerror = () => settle(null);
    img.src = dataUri;
  });
}

export async function detectFaceAndQuality(dataUri: string): Promise<{ valid: boolean; message?: string }> {
  // Face detection requires downloading the blazeface model — skip offline and
  // stay permissive (the server remains the source of truth for real analysis).
  if (isOffline()) return { valid: true };
  try {
    const model = await blazeface.load();
    const canvas = await createImageData(dataUri);
    if (!canvas) return { valid: true };
    const face = await model.estimateFaces(canvas, false);

    
    if (face.length === 0) {
      return { valid: false, message: 'No face detected. Please ensure your face is clearly visible in the photo.' };
    }

    if (face.length > 1) {
      return { valid: false, message: 'Multiple faces detected. Please ensure only your face is in the frame.' };
    }

    const dims = await readImageDimensions(dataUri);
    if (!dims) return { valid: true };

    // Check face size
    const faceWidth = Math.abs((face[0].topLeft as [number, number])[0] - (face[0].bottomRight as [number, number])[0]);
    const faceSizeRatio = faceWidth / dims.width;
    
    if (faceSizeRatio < 0.1) {
      return { valid: false, message: 'Face too small. Move closer to the camera or zoom in.' };
    }

    return { valid: true };
  } catch (err) {
    console.warn('Face detection failed:', err);
    return { valid: true }; // Don't fail if detection fails
  }
}

async function createImageData(dataUri: string): Promise<HTMLCanvasElement | null> {
  const img = await loadImage(dataUri);
  if (!img || !img.width || !img.height || typeof document === 'undefined') return null;

  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  return canvas;
}

async function readImageDimensions(dataUri: string): Promise<{ width: number; height: number } | null> {
  const img = await loadImage(dataUri);
  if (!img || !img.naturalWidth) return null;
  return { width: img.naturalWidth, height: img.naturalHeight };
}

export async function analyzeImageQuality(dataUri: string): Promise<{ valid: boolean; message?: string }> {
  const canvas = await createImageData(dataUri);
  if (!canvas) return { valid: true }; // Can't decode offline/in test — stay permissive.

  const ctx = canvas.getContext('2d');
  if (!ctx) return { valid: true };
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  // Blur detection
  let variance = 0;
  for (let i = 0; i < data.length; i += 4) {
    const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
    variance += brightness * brightness;
  }
  variance /= data.length / 4;
  const normalizedVariance = Math.sqrt(variance) / 255;
  
  if (normalizedVariance < 0.1) {
    return { valid: false, message: 'Image appears blurry. Hold the camera steady or use a better photo.' };
  }
  
  // Lighting analysis
  let darkPixels = 0;
  let brightPixels = 0;
  
  for (let i = 0; i < data.length; i += 4) {
    const brightness = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    
    if (brightness < 30) darkPixels++;
    if (brightness > 225) brightPixels++;
  }
  
  if (darkPixels > data.length / 3) {
    return { valid: false, message: 'Image too dark. Ensure good lighting on your face.' };
  }
  
  if (brightPixels > data.length / 8) {
    return { valid: false, message: 'Image too bright or overexposed. Reduce harsh lighting.' };
  }
  
  return { valid: true };
}

export async function checkPrivacyCompliance(dataUri: string): Promise<{ valid: boolean; message?: string }> {
  // Tesseract downloads its WASM worker + language data from a CDN — skip when
  // offline so validation never surfaces a raw "NetworkError".
  if (isOffline()) return { valid: true };
  try {
    const Tesseract = (await import('tesseract.js')).default;
    
    const { data: { text } } = await Tesseract.recognize(
      dataUri,
      'eng',
      { logger: m => console.log(m) }
    );
    
    const sensitivePatterns = [
      /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/, // Credit card
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN
      /\b\d{10,}\b/, // Long numbers
      /password|confidential|private/i
    ];
    
    for (const pattern of sensitivePatterns) {
      if (pattern.test(text)) {
        return { valid: false, message: 'Image may contain sensitive information. Please upload a different photo.' };
      }
    }
    
    return { valid: true };
  } catch (err) {
    console.warn('Privacy check failed:', err);
    return { valid: true }; // Don't fail if OCR fails
  }
}

export async function checkOrientationAndPose(dataUri: string): Promise<{ valid: boolean; message?: string }> {
  const dims = await readImageDimensions(dataUri);
  if (!dims) return { valid: true };

  // Portrait selfies are valid for face analysis — orientation alone is not
  // disqualifying. Only reject extreme aspect ratios that crop the face badly.
  const ratio = dims.height / dims.width;
  if (ratio > 2.5 || ratio < 0.4) {
    return {
      valid: false,
      message: 'Photo is too stretched. Take a standard upright selfie so your whole face fits.',
    };
  }

  return { valid: true };
}

export async function runFullImageValidation(
  dataUri: string,
  onProgress?: (progress: number, message: string) => void
): Promise<{ valid: boolean; message?: string }> {
  const checks = [
    {
      name: 'Face Detection',
      fn: () => detectFaceAndQuality(dataUri)
    },
    {
      name: 'Quality Analysis',
      fn: () => analyzeImageQuality(dataUri)
    },
    {
      name: 'Orientation Check',
      fn: () => checkOrientationAndPose(dataUri)
    },
    {
      name: 'Privacy Check',
      fn: () => checkPrivacyCompliance(dataUri)
    }
  ];
  
  for (let i = 0; i < checks.length; i++) {
    const progress = ((i + 1) / checks.length) * 100;
    if (onProgress) {
      onProgress(progress, `Checking: ${checks[i].name}...`);
    }
    
    try {
      const result = await checks[i].fn();
      if (!result.valid) {
        return result;
      }
    } catch (err) {
      console.warn(`${checks[i].name} failed:`, err);
    }
  }
  
  return { valid: true };
}