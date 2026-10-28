import { useEffect, type RefObject } from "react";

const LINE_HEIGHT_PX = 16;

type ScrollMetrics = Pick<HTMLElement, "scrollLeft" | "scrollWidth" | "clientWidth">;
type WheelInput = Pick<WheelEvent, "deltaX" | "deltaY" | "deltaMode" | "shiftKey">;

/**
 * Horizontal distance a vertical wheel event should scroll, or 0 to keep the native behavior
 * (no overflow, horizontal gesture, Shift + wheel, or already at the edge so the page can scroll).
 */
export function getHorizontalWheelDelta(element: ScrollMetrics, event: WheelInput): number {
  if (event.shiftKey || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return 0;

  const maxScrollLeft = element.scrollWidth - element.clientWidth;
  if (maxScrollLeft <= 0) return 0;

  const delta = event.deltaMode === 1 ? event.deltaY * LINE_HEIGHT_PX : event.deltaY;
  if (delta < 0 && element.scrollLeft <= 0) return 0;
  if (delta > 0 && element.scrollLeft >= maxScrollLeft - 1) return 0;

  return delta;
}

/**
 * Lets a vertical mouse wheel scroll a horizontally overflowing element whose scrollbar is hidden
 * (e.g. the character sheet tab bar). Touch, trackpad and keyboard scrolling stay native.
 */
export function useHorizontalWheelScroll<T extends HTMLElement>(ref: RefObject<T | null>) {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleWheel = (event: WheelEvent) => {
      const delta = getHorizontalWheelDelta(element, event);
      if (delta === 0) return;
      event.preventDefault();
      element.scrollLeft += delta;
    };

    // Non-passive so preventDefault stops the page from scrolling vertically at the same time
    element.addEventListener("wheel", handleWheel, { passive: false });
    return () => element.removeEventListener("wheel", handleWheel);
  }, [ref]);
}
