// Client-side image handling: downscale an uploaded photo to a sane size before
// we store it as a data URL. Full-resolution phone photos would bloat the vault
// snapshot (and any folder mirror / cloud snapshot), so we cap the longest edge
// and re-encode as JPEG. Also returns the scaled dimensions for layout.

export interface ProcessedImage {
  src: string; // data URL
  width: number;
  height: number;
}

const DEFAULT_MAX_DIM = 1600;
const DEFAULT_QUALITY = 0.82;

function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('read failed'));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('decode failed'));
    img.src = src;
  });
}

/**
 * Downscale + re-encode a picked image file. Falls back to the raw data URL if
 * anything in the canvas path fails (e.g. an exotic format), so a photo always
 * gets stored.
 */
export async function processImageFile(
  file: File,
  maxDim = DEFAULT_MAX_DIM,
  quality = DEFAULT_QUALITY,
): Promise<ProcessedImage> {
  const raw = await readAsDataUrl(file);
  try {
    const img = await loadImage(raw);
    const { width, height } = img;
    const scale = Math.min(1, maxDim / Math.max(width, height));
    const w = Math.max(1, Math.round(width * scale));
    const h = Math.max(1, Math.round(height * scale));

    // No downscale needed and it's already a compact format — keep the original.
    if (scale === 1 && file.size < 500_000) return { src: raw, width: w, height: h };

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return { src: raw, width, height };
    ctx.drawImage(img, 0, 0, w, h);
    const out = canvas.toDataURL('image/jpeg', quality);
    // Guard against canvas producing something larger than the source.
    return out.length < raw.length ? { src: out, width: w, height: h } : { src: raw, width: w, height: h };
  } catch {
    return { src: raw, width: 0, height: 0 };
  }
}
