import { cn } from "@/lib/utils";

/** Default dialog padding and corner close button, like the other app dialogs. */
export const CREATE_CHARACTER_DIALOG_CONTENT = "gap-6 sm:max-w-md";

/** Manual creation buttons: side by side from sm, stacked on mobile so labels stay on one line. */
export const CREATE_CHARACTER_MANUAL_GROUP = "grid grid-cols-1 gap-2 sm:grid-cols-2";

/** Player character: primary white button (same as the sidebar create buttons). */
export const CREATE_CHARACTER_PLAYER_BUTTON = cn(
  "w-full border border-frame bg-white text-black hover:bg-gray-200 hover:brightness-100",
  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
);

/** NPC: standard secondary (outline) button. */
export const CREATE_CHARACTER_NPC_BUTTON = "w-full";

/** Community library section: plain content, no card frame. */
export const CREATE_CHARACTER_LIBRARY_SECTION = "flex flex-col gap-3";
