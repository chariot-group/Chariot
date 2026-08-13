interface EnterKeyboardEvent {
  key: string;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
}

/**
 * True when Enter is pressed without cmd/ctrl/shift modifiers.
 */
export function isEnterWithoutModifiers(event: EnterKeyboardEvent): boolean {
  return event.key === "Enter" && !event.metaKey && !event.ctrlKey && !event.shiftKey;
}

/**
 * True when Enter is combined with cmd/ctrl/shift.
 */
export function isEnterWithModifiers(event: EnterKeyboardEvent): boolean {
  return event.key === "Enter" && (event.metaKey || event.ctrlKey || event.shiftKey);
}

/**
 * True when the keyboard event target is an element where typing is expected.
 */
export function isTypingInInputElement(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;

  const tagName = target.tagName;
  if (target.isContentEditable) return true;
  if (tagName === "TEXTAREA" || tagName === "SELECT") return true;

  if (tagName === "INPUT") {
    const input = target as HTMLInputElement;
    const nonTypingInputTypes = new Set([
      "button",
      "checkbox",
      "color",
      "file",
      "image",
      "radio",
      "range",
      "reset",
      "submit",
    ]);

    return !nonTypingInputTypes.has(input.type);
  }

  return false;
}

/**
 * True when a modal dialog layer is open and should consume Escape before
 * form-level cancel shortcuts.
 *
 * @see FR-character-form-nested-escape
 */
export function isModalOverlayOpen(root: ParentNode = document): boolean {
  const candidates = root.querySelectorAll<HTMLElement>(
    '[role="dialog"], [role="alertdialog"], [data-slot="dialog-content"]',
  );

  for (const el of candidates) {
    const state = el.getAttribute("data-state");
    if (state === "closed") continue;
    if (el.getAttribute("aria-hidden") === "true") continue;
    return true;
  }

  return false;
}