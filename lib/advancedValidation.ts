/** Advanced image validation features.
 * Face detection, quality analysis, and privacy checks.
 */

import * as blazeface from '@tensorflow-models/blazeface';
import * as tf from '@tensorflow/tfjs';

export async function detectFaceAndQuality(dataUri: string): Promise<{ valid: boolean; message?: string }> {
  try {
    const model = await blazeface.load();
    const face = await model.estimateFaces(await createImageData(dataUri), false);
    
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

async function createImageData(dataUri: string): Promise<HTMLCanvasElement> {
  const img = new Image();
  img.src = dataUri;
  await new Promise(resolve => { img.onload = resolve; });
  
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  return canvas;
}

async function readImageDimensions(dataUri: string): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const img = new Image();
    let settled = false;
    const settle = (value: { width: number; height: number } | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(value);
    };
    const timer = setTimeout(() => settle(null), 2000);
    img.onload = () => settle({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => settle(null);
    img.src = dataUri;
  });
}

export async function analyzeImageQuality(dataUri: string): Promise<{ valid: boolean; message?: string }> {
  const img = new Image();
  img.src = dataUri;
  await new Promise(resolve => { img.onload = resolve; });
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0);
  
  const imageData = ctx.getImageData(0, 0, img.width, img.height);
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
  
  // Check if image is portrait (not landscape)
  const isPortrait = dims.height > dims.width;
  if (isPortrait) {
    return { valid: false, message: 'Please rotate your device to landscape orientation.' };
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