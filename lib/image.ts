/**
 * Image utilities
 *
 * Compress/resize captured or uploaded images before analysis and before
 * persisting them to localStorage. Without this, a single 10MB upload expands
 * to ~13MB of base64 and storing several of them blows past the ~5MB
 * localStorage quota, which throws and breaks the app (SRS FR4.1 + NF1.4).
 */

export interface CompressOptions {
  /** Longest edge of the output image in pixels. Default 1024. */
  maxDimension?: number;
  /** JPEG/WebP quality from 0-1. Default 0.7. */
  quality?: number;
  /** Output MIME type. Default image/jpeg. */
  mimeType?: string;
}

function loadImage(src: string, timeoutMs = 1500): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (typeof Image === 'undefined') {
      reject(new Error('Image is not supported in this environment'));
      return;
    }

    const img = new Image();
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error('Image load timed out'));
    }, timeoutMs);

    img.onload = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(img);
    };
    img.onerror = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(new Error('Image failed to load'));
    };
    img.src = src;
  });
}

/**
 * Downscale + re-encode a data URL to a smaller data URL.
 *
 * Falls back to returning the original data unchanged whenever the canvas API,
 * image decoding, or dimensions are unavailable (e.g. jsdom in tests), so this
 * never throws and never hangs callers.
 */
export async function compressImage(
  dataUrl: string,
  options: CompressOptions = {}
): Promise<string> {
  const { maxDimension = 1024, quality = 0.7, mimeType = 'image/jpeg' } = options;

  if (typeof document === 'undefined') {
    return dataUrl;
  }

  try {
    const image = await loadImage(dataUrl);

    // Zero dimensions means decoding failed (e.g. jsdom) — keep the original.
    if (!image.width || !image.height) {
      return dataUrl;
    }

    const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return dataUrl;
    }

    ctx.drawImage(image, 0, 0, width, height);
    const compressed = canvas.toDataURL(mimeType, quality);

    return compressed && compressed.length > 0 ? compressed : dataUrl;
  } catch {
    return dataUrl;
  }
}
