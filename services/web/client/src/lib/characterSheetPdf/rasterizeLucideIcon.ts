/** @see FR-character-sheet-pdf-export */

import { buildLucideSvgString } from "@/lib/characterSheetPdf/buildLucideSvgString";
import type { LucidePdfIconNode } from "@/lib/characterSheetPdf/lucidePdfIconNodes";

const RASTER_SIZE = 36;

export async function rasterizeLucideIcon(
  iconNode: LucidePdfIconNode,
  color: string,
  size = RASTER_SIZE,
): Promise<string | null> {
  if (typeof document === "undefined") return null;

  const svg = buildLucideSvgString(iconNode, color);
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const objectUrl = URL.createObjectURL(blob);

  try {
    return await new Promise<string>((resolve, reject) => {
      const image = new window.Image();
      image.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = size;
          canvas.height = size;
          const context = canvas.getContext("2d");
          if (!context) {
            reject(new Error("Canvas 2D context unavailable"));
            return;
          }
          context.clearRect(0, 0, size, size);
          context.drawImage(image, 0, 0, size, size);
          resolve(canvas.toDataURL("image/png"));
        } catch (error) {
          reject(error);
        }
      };
      image.onerror = () => reject(new Error("Failed to load Lucide SVG for rasterization"));
      image.src = objectUrl;
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
