/** @see FR-sidebar-npc-link — long Player names in context/overflow menus */
export const SIDEBAR_MENU_EMBEDDED_NAME_MAX_LENGTH = 24;

/** Campaign / group names embedded in success toasts (320px wide on desktop). @see docs/design.md §6.4 */
export const TOAST_EMBEDDED_NAME_MAX_LENGTH = 32;

export function truncateForSidebarMenuLabel(value: string, maxLength = SIDEBAR_MENU_EMBEDDED_NAME_MAX_LENGTH): string {
  const trimmed = value.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  return `${trimmed.slice(0, Math.max(1, maxLength - 1)).trimEnd()}…`;
}
