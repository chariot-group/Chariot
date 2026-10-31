/** @see FR-sidebar-npc-link — long Player names in context/overflow menus */
export const SIDEBAR_MENU_EMBEDDED_NAME_MAX_LENGTH = 24;

export function truncateForSidebarMenuLabel(
  value: string,
  maxLength = SIDEBAR_MENU_EMBEDDED_NAME_MAX_LENGTH,
): string {
  const trimmed = value.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  return `${trimmed.slice(0, Math.max(1, maxLength - 1)).trimEnd()}…`;
}
