import * as React from "react";
import { MOBILE_BREAKPOINT, TABLET_BREAKPOINT } from "@/hooks/use-mobile";

export type ConcentrationBadgeCompactionPreset = {
  labelMode: "full" | "short";
  showInfo: boolean;
  showDrop: boolean;
  showPendingLabel: boolean;
};

/** Du plus verbeux au plus compact — appliqué tant que le badge déborde son conteneur. */
export const CONCENTRATION_BADGE_COMPACTION_LEVELS: ConcentrationBadgeCompactionPreset[] = [
  { labelMode: "full", showInfo: true, showDrop: true, showPendingLabel: true },
  { labelMode: "short", showInfo: false, showDrop: true, showPendingLabel: true },
  { labelMode: "short", showInfo: false, showDrop: true, showPendingLabel: false },
  { labelMode: "short", showInfo: false, showDrop: false, showPendingLabel: false },
];

const MAX_COMPACTION_LEVEL = CONCENTRATION_BADGE_COMPACTION_LEVELS.length - 1;
const PARENT_WIDTH_EXPAND_DELTA = 12;

function resolveBadgeSlotContainer(element: HTMLElement): HTMLElement | null {
  return element.closest("[data-concentration-badge-slot]")?.parentElement
    ?? element.parentElement;
}

/** Compare la largeur naturelle du badge à la place offerte par le conteneur. */
export function shouldCompactConcentrationBadge(
  element: HTMLElement,
  level: number,
): boolean {
  if (level >= MAX_COMPACTION_LEVEL) return false;

  const slotContainer = resolveBadgeSlotContainer(element);
  if (slotContainer && element.scrollWidth > slotContainer.clientWidth + 1) {
    return true;
  }

  const label = element.querySelector("[data-concentration-badge-label]");
  if (label instanceof HTMLElement && label.clientWidth < 4) {
    return true;
  }

  return element.scrollWidth > element.clientWidth + 1;
}

function useIsMobileViewport(): boolean {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const sync = () => setIsMobile(mediaQuery.matches);
    sync();
    mediaQuery.addEventListener("change", sync);
    return () => mediaQuery.removeEventListener("change", sync);
  }, []);

  return isMobile;
}

function useIsTabletViewport(): boolean {
  const [isTablet, setIsTablet] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia(
      `(min-width: ${MOBILE_BREAKPOINT}px) and (max-width: ${TABLET_BREAKPOINT - 1}px)`,
    );
    const sync = () => setIsTablet(mediaQuery.matches);
    sync();
    mediaQuery.addEventListener("change", sync);
    return () => mediaQuery.removeEventListener("change", sync);
  }, []);

  return isTablet;
}

function getInitialCompactionLevel(isTablet: boolean): number {
  return isTablet ? 1 : 0;
}

export function useConcentrationBadgeCompaction(
  measureRef: React.RefObject<HTMLElement | null>,
  options: { canEdit: boolean; hasPendingCheck: boolean },
): ConcentrationBadgeCompactionPreset {
  const isMobileViewport = useIsMobileViewport();
  const isTabletViewport = useIsTabletViewport();
  const [level, setLevel] = React.useState(() =>
    typeof window === "undefined"
      ? 0
      : getInitialCompactionLevel(
          window.innerWidth >= MOBILE_BREAKPOINT && window.innerWidth < TABLET_BREAKPOINT,
        ),
  );
  const parentWidthRef = React.useRef(0);

  React.useLayoutEffect(() => {
    if (isTabletViewport) {
      setLevel((current) => Math.max(current, 1));
    }
  }, [isTabletViewport]);

  React.useLayoutEffect(() => {
    const element = measureRef.current;
    if (!element) return;

    const slotContainer = resolveBadgeSlotContainer(element);
    if (!slotContainer) return;

    const observer = new ResizeObserver(() => {
      const parentWidth = slotContainer.clientWidth;
      if (parentWidth > parentWidthRef.current + PARENT_WIDTH_EXPAND_DELTA) {
        parentWidthRef.current = parentWidth;
        setLevel(getInitialCompactionLevel(isTabletViewport));
        return;
      }
      parentWidthRef.current = parentWidth;
    });

    observer.observe(slotContainer);
    parentWidthRef.current = slotContainer.clientWidth;

    return () => observer.disconnect();
  }, [isTabletViewport, measureRef]);

  React.useLayoutEffect(() => {
    const element = measureRef.current;
    if (!element) return;

    if (shouldCompactConcentrationBadge(element, level)) {
      setLevel((current) => Math.min(current + 1, MAX_COMPACTION_LEVEL));
    }
  }, [level, measureRef, options.canEdit, options.hasPendingCheck, isTabletViewport]);

  const preset = CONCENTRATION_BADGE_COMPACTION_LEVELS[level] ?? CONCENTRATION_BADGE_COMPACTION_LEVELS[0];

  return {
    labelMode: preset.labelMode,
    // ⓘ réservé au téléphone avec libellé complet (FR-tracker-concentration).
    showInfo: preset.showInfo && isMobileViewport && preset.labelMode === "full",
    showDrop: preset.showDrop && options.canEdit,
    showPendingLabel: preset.showPendingLabel && options.hasPendingCheck,
  };
}
