/**
 * Shared layout for the profile identity card (read and edit views), identical on every breakpoint
 * so switching between them does not shift the page (docs/design.md §6.4):
 * a header row (round avatar top-left + identity), then full-width details below.
 */
export const profileCardClassName = "flex flex-col gap-4 sm:gap-6 overflow-hidden";

/** Header row: round avatar top-left, identity next to it. */
export const profileHeaderClassName = "flex items-center gap-4 sm:gap-6 min-w-0";

export const profileAvatarColumnClassName = "shrink-0";

export const profileIdentityClassName = "flex min-w-0 flex-1 flex-col gap-1";

export const profileUsernameClassName = "text-2xl sm:text-3xl lg:text-4xl font-bold wrap-break-word";

/** Pair of name inputs: stacked on mobile, side by side from `sm`. */
export const profileNameFieldsClassName = "flex flex-col sm:flex-row gap-4";

/** Visible field label above each input (same style as the other edit forms). */
export const profileFieldLabelClassName = "text-sm font-medium text-muted-foreground";

/** Form actions: full-width stack with the primary action on top on mobile, right-aligned row from `sm`. */
export const profileActionsClassName = "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end";

export const profileActionButtonClassName = "w-full sm:w-auto";
