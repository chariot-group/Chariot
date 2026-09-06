import type { CSSProperties } from "react";

const DEFAULT_GAP_PX = 4;
const DEFAULT_MAX_HEIGHT_PX = 240; // matches Tailwind max-h-60

type RectLike = Pick<DOMRect, "top" | "bottom" | "left" | "width">;

/**
 * Computes fixed-position styles for a portaled combobox suggestions list.
 * Opens below the input when possible, otherwise above to avoid viewport clipping.
 */
export function getComboboxSuggestionsStyle(
  inputRect: RectLike,
  viewportHeight: number,
  gapPx = DEFAULT_GAP_PX,
  maxHeightPx = DEFAULT_MAX_HEIGHT_PX,
): CSSProperties {
  const spaceBelow = viewportHeight - inputRect.bottom - gapPx;
  const spaceAbove = inputRect.top - gapPx;
  const openAbove = spaceBelow < Math.min(maxHeightPx, 120) && spaceAbove > spaceBelow;

  if (openAbove) {
    return {
      position: "fixed",
      top: "auto",
      bottom: viewportHeight - inputRect.top + gapPx,
      left: inputRect.left,
      width: inputRect.width,
      maxHeight: Math.min(maxHeightPx, Math.max(spaceAbove, 0)),
    };
  }

  return {
    position: "fixed",
    top: inputRect.bottom + gapPx,
    bottom: "auto",
    left: inputRect.left,
    width: inputRect.width,
    maxHeight: Math.min(maxHeightPx, Math.max(spaceBelow, 0)),
  };
}
