/**
 * Shared look of every floating menu (dropdown, context menu, select, combobox, multi-select…).
 * The GM space menu of the sidebar is the visual reference: change it here to change them all.
 */

/** Floating surface (border, radius, padding). Position/animation classes stay in each primitive. */
export const menuSurfaceClassName =
  "bg-popover text-popover-foreground border-frame rounded-[14px] border p-1.5 shadow-md";

/** Interactive row: hover, keyboard highlight and disabled state. */
export const menuItemClassName =
  "relative flex w-full cursor-pointer items-center gap-2 rounded-[10px] px-3 py-2 text-left text-sm text-white outline-hidden select-none transition-colors hover:bg-white/10 focus:bg-white/10 data-highlighted:bg-white/10 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4";

/** Selected/checked row (same gray as selected rows in the sidebar). */
export const menuItemSelectedClassName = "bg-white/15 font-medium";

/** Destructive row. */
export const menuItemDestructiveClassName =
  "text-destructive hover:bg-destructive/10 focus:bg-destructive/10 data-highlighted:bg-destructive/10 *:[svg]:!text-destructive";

/** Leading icons of non-destructive rows. */
export const menuItemIconClassName = "[&_svg:not([class*='text-'])]:text-white/60";

export const menuSeparatorClassName = "mx-1 my-1 h-px bg-white/10";

export const menuLabelClassName = "px-3 py-1.5 text-xs font-medium text-muted-foreground";
