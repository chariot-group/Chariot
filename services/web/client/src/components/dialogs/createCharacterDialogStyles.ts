/** Default dialog padding and corner close button, like the other app dialogs. */
export const CREATE_CHARACTER_DIALOG_CONTENT = "gap-6 sm:max-w-md";

/** Manual creation buttons: side by side from sm, stacked on mobile so labels stay on one line. */
export const CREATE_CHARACTER_MANUAL_GROUP = "grid grid-cols-1 gap-2 sm:grid-cols-2";

/** Player character: `variant="secondary"`, same hierarchy as the NPC choice (peer options). */
export const CREATE_CHARACTER_PLAYER_BUTTON = "w-full";

/** NPC: `variant="secondary"`, same hierarchy as the Player choice (peer options). */
export const CREATE_CHARACTER_NPC_BUTTON = "w-full";

/** Step-by-step builder (Player only): full row under the manual choices. @see FR-ruleset-character-builder */
export const CREATE_CHARACTER_BUILDER_BUTTON = "w-full sm:col-span-2";

/** Community library section: plain content, no card frame. */
export const CREATE_CHARACTER_LIBRARY_SECTION = "flex flex-col gap-3";
