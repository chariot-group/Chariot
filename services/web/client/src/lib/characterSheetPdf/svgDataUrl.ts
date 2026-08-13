/** @see FR-character-sheet-pdf-export */

/**
 * react-pdf / pdfkit only embeds SVG images from base64 data URLs.
 * `data:image/svg+xml;utf8,...` is rejected with "Invalid base64 image".
 */
export function svgDataUrl(svg: string): string {
  const base64 =
    typeof Buffer !== "undefined"
      ? Buffer.from(svg, "utf8").toString("base64")
      : btoa(unescape(encodeURIComponent(svg)));
  return `data:image/svg+xml;base64,${base64}`;
}
