const PORTALED_FILTER_CONTENT_SELECTOR =
  '[data-slot="dropdown-menu-content"], [data-slot="select-content"]';

/** Tracks open Radix Select/DropdownMenu filters inside a Dialog (portaled content). */
export function createPortaledFilterOpenTracker() {
  let openCount = 0;

  return {
    notifyOpenChange(open: boolean) {
      if (open) {
        openCount += 1;
        return;
      }

      // Defer close so Dialog outside handlers still see the menu as open during the same pointer event.
      queueMicrotask(() => {
        openCount = Math.max(0, openCount - 1);
      });
    },
    hasOpen() {
      return openCount > 0;
    },
    reset() {
      openCount = 0;
    },
  };
}

export function isPortaledFilterInteractionTarget(target: EventTarget | null): boolean {
  if (target == null || typeof target !== "object" || !("closest" in target)) {
    return false;
  }

  const element = target as Element;
  return typeof element.closest === "function" && element.closest(PORTALED_FILTER_CONTENT_SELECTOR) !== null;
}

export function shouldPreventDialogDismissForPortaledFilter(
  tracker: ReturnType<typeof createPortaledFilterOpenTracker>,
  target: EventTarget | null,
): boolean {
  return tracker.hasOpen() || isPortaledFilterInteractionTarget(target);
}
