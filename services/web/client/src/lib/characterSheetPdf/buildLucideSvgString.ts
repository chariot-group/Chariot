/** @see FR-character-sheet-pdf-export */

import type { LucidePdfIconNode } from "@/lib/characterSheetPdf/lucidePdfIconNodes";
import { svgDataUrl } from "@/lib/characterSheetPdf/svgDataUrl";

function serializeLucideElement(tag: string, attrs: Record<string, string | number>): string {
  switch (tag) {
    case "path":
      return `<path d="${String(attrs.d)}"/>`;
    case "circle":
      return `<circle cx="${attrs.cx}" cy="${attrs.cy}" r="${attrs.r}"/>`;
    case "line":
      return `<line x1="${attrs.x1}" y1="${attrs.y1}" x2="${attrs.x2}" y2="${attrs.y2}"/>`;
    case "rect":
      return `<rect x="${attrs.x}" y="${attrs.y}" width="${attrs.width}" height="${attrs.height}"${attrs.rx != null ? ` rx="${attrs.rx}"` : ""}${attrs.ry != null ? ` ry="${attrs.ry}"` : ""}/>`;
    case "polyline":
      return `<polyline points="${attrs.points}"/>`;
    case "polygon":
      return `<polygon points="${attrs.points}"/>`;
    default:
      return "";
  }
}

export function buildLucideSvgString(iconNode: LucidePdfIconNode, color: string): string {
  const body = iconNode.map(([tag, attrs]) => serializeLucideElement(tag, attrs)).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
}

export function buildLucideSvgDataUrl(iconNode: LucidePdfIconNode, color: string): string {
  return svgDataUrl(buildLucideSvgString(iconNode, color));
}
