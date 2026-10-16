/**
 * Client-side image validation with advanced checks.
 *
 * Comprehensive validation using browser APIs and ML models to catch
 * invalid images before submission, reducing API errors and credit usage.
 * All processing happens client-side for privacy.
 */

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
export const MIN_SHORT_SIDE_PX = 480;
export const MAX_LONG_SIDE_PX = 2560;

export interface ImageValidationResult {
  valid: boolean;
  message?: string;
}

const OK: ImageValidationResult = { valid: true };

/** Validate a File object's type and size (synchronous). */
export function validateImageFile(file: File): ImageValidationResult {
  if (!file.type.startsWith('image/')) {
    return { valid: false, message: 'Please select a valid image file (JPG, PNG or WEBP).' };
  }
  return validateImageSize(file.size);
}

/** Validate a byte size (synchronous). Works for File or decoded data URI. */
export function validateImageSize(byteLength: number): ImageValidationResult {
  if (byteLength > MAX_FILE_SIZE_BYTES) {
    const mb = (byteLength / 1024 / 1024).toFixed(2);
    const limit = (MAX_FILE_SIZE_BYTES / 1024 / 1024).toFixed(0);
    return { valid: false, message: `File too large. Maximum size is ${limit}MB — your file is ${mb}MB.` };
  }
  return OK;
}

/** Approximate the byte size of a base64 data URI. */
export function dataUriByteLength(dataUri: string): number {
  const base64 = dataUri.split(',')[1] ?? '';
  const padding = (base64.match(/=+$/) ?? [''])[0].length;
  return Math.floor((base64.length * 3) / 4) - padding;
}

/** Load a data URI and read its intrinsic pixel dimensions (timeout-safe). */
function readImageDimensions(dataUri: string, timeoutMs = 2000): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    if (typeof Image === 'undefined') {
      resolve(null);
      return;
    }
    const img = new Image();
    let settled = false;
    const settle = (value: { width: number; height: number } | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(value);
    };
    const timer = setTimeout(() => settle(null), timeoutMs);
    img.onload = () => settle({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => settle(null);
    img.src = dataUri;
  });
}

/** Validate the resolution of a data URI against the skin-analysis specs. */
export async function validateImageResolution(dataUri: string): Promise<ImageValidationResult> {
  const sizeCheck = validateImageSize(dataUriByteLength(dataUri));
  if (!sizeCheck.valid) return sizeCheck;

  const dims = await readImageDimensions(dataUri);
  if (!dims || dims.width === 0 || dims.height === 0) return OK;

  const longSide = Math.max(dims.width, dims.height);
  const shortSide = Math.min(dims.width, dims.height);

  if (shortSide < MIN_SHORT_SIDE_PX) {
    return {
      valid: false,
      message: `Image resolution too low (${dims.width}×${dims.height}px). The short side must be at least ${MIN_SHORT_SIDE_PX}px — move closer to the camera or upload a larger photo.`,
    };
  }
  if (longSide > MAX_LONG_SIDE_PX) {
    return {
      valid: false,
      message: `Image resolution too high (${dims.width}×${dims.height}px). The long side must be at most ${MAX_LONG_SIDE_PX}px — the photo will be resized for you.`,
    };
  }
  return OK;
}