/** @see FR-character-sheet-pdf-export */

import QRCode from "qrcode";

export async function buildCharacterQrCodeDataUrl(url: string): Promise<string | null> {
  const trimmed = url.trim();
  if (!trimmed) return null;

  try {
    return await QRCode.toDataURL(trimmed, {
      width: 128,
      margin: 1,
      color: {
        dark: "#1a1a1a",
        light: "#ffffff",
      },
      errorCorrectionLevel: "M",
    });
  } catch {
    return null;
  }
}
