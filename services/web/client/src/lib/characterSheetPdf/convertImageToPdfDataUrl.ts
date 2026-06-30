/** @see FR-character-sheet-pdf-export */

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image load failed"));
    img.src = url;
  });
}

async function blobToPngDataUrl(blob: Blob): Promise<string | null> {
  if (typeof document === "undefined") {
    return null;
  }

  const objectUrl = URL.createObjectURL(blob);
  try {
    const img = await loadImage(objectUrl);
    const width = img.naturalWidth || img.width;
    const height = img.naturalHeight || img.height;
    if (!width || !height) {
      return null;
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return null;
    }

    ctx.drawImage(img, 0, 0, width, height);
    return canvas.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/**
 * Fetches an image and converts it to PNG data URL for @react-pdf/renderer.
 * WebP/HEIC avatars from private storage are not supported natively by react-pdf.
 */
export async function convertImageToPdfDataUrl(sourceUrl: string): Promise<string | null> {
  const trimmed = sourceUrl.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const response = await fetch(trimmed, { mode: "cors" });
    if (!response.ok) {
      return null;
    }
    const blob = await response.blob();
    const pngDataUrl = await blobToPngDataUrl(blob);
    if (pngDataUrl) {
      return pngDataUrl;
    }

    // Fallback for already-supported formats when canvas conversion fails.
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(typeof reader.result === "string" ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}
