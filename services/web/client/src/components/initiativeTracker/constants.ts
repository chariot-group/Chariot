import type { ActiveInitiativeTrackerCondition } from "@/components/initiativeTracker/types";
import { ROUND_DURATION_SECONDS } from "@/components/initiativeTracker/conditionDuration";

export { ROUND_DURATION_SECONDS };

export const CONDITIONS: ActiveInitiativeTrackerCondition[] = [
  "prone",
  "grappled",
  "deafened",
  "blinded",
  "charmed",
  "frightened",
  "poisoned",
  "restrained",
  "stunned",
  "incapacitated",
  "unconscious",
  "invisible",
  "paralyzed",
  "petrified",
];

export const SESSION_PARTICIPANTS_GROUP_ID = "__session_participants__";

/**
 * FR-combat-initiative-tracker — table columns. Narrow fixed tracks for selection / show / initiative,
 * bounded name and group tracks (20 characters max), armor class before hit points,
 * the spare width goes to conditions.
 */
const TRACKER_COLUMN_TRACKS = {
  selection: "1.25rem",
  visible: "2rem",
  initiativeEditable: "5.75rem",
  initiativeLocked: "3rem",
  character: "minmax(8rem, 16rem)",
  armorClass: "3rem",
  hitPoints: "6rem",
  // At least one full condition pill (+ the edit button) always fits; the group gives up width first.
  condition: "minmax(10rem, 1fr)",
  group: "minmax(4rem, 14rem)",
} as const;

export function getTrackerGridTemplateColumns({
  selection,
  visibility,
  initiativeEditable,
}: {
  selection: boolean;
  visibility: boolean;
  initiativeEditable: boolean;
}): string {
  const t = TRACKER_COLUMN_TRACKS;
  return [
    selection ? t.selection : null,
    visibility ? t.visible : null,
    initiativeEditable ? t.initiativeEditable : t.initiativeLocked,
    t.character,
    t.armorClass,
    t.hitPoints,
    t.condition,
    t.group,
  ]
    .filter(Boolean)
    .join(" ");
}

export const TRACKER_GRID_TEMPLATE_COLUMNS = getTrackerGridTemplateColumns({
  selection: false,
  visibility: true,
  initiativeEditable: true,
});

export const TRACKER_GRID_TEMPLATE_COLUMNS_WITH_SELECTION = getTrackerGridTemplateColumns({
  selection: true,
  visibility: true,
  initiativeEditable: true,
});

/** FR-session-combat-navigation — grille sans colonne visibilité MJ (vue joueur). */
export const PLAYER_TRACKER_GRID_TEMPLATE_COLUMNS = getTrackerGridTemplateColumns({
  selection: false,
  visibility: false,
  initiativeEditable: true,
});

/** One minimal gap between every column, shared by the heading row and the rows. */
export const TRACKER_GRID_GAP_CLASS = "gap-x-4";

/** Horizontal padding shared by every zone of the tracker card (toolbar, headings, rows, footer). */
export const TRACKER_CARD_PADDING_X_CLASS = "px-3 sm:px-5";

/**
 * FR-combat-initiative-tracker — the card fits the screen height (header / footer fixed, rows scroll),
 * except on very short screens (phone landscape) where the page scrolls to leave room for the rows.
 * Apply on the page wrapper and on the card.
 */
export const TRACKER_FIT_SCREEN_CLASS = "[@media(min-height:30rem)]:min-h-0";

/** Rows area: the only scrolling zone of the card, with the project scrollbar tokens. */
export const TRACKER_ROWS_SCROLL_CLASS =
  "min-h-0 overflow-y-auto overscroll-contain focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-scrollbar-track [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-scrollbar-thumb [&::-webkit-scrollbar-thumb]:hover:bg-scrollbar-thumb-hover";

/** Vertical rhythm shared by the toolbar, the column headings, the rows and the footer. */
export const TRACKER_ZONE_PADDING_Y_CLASS = "py-3";

/** Classes obligatoires sur chaque cellule directe de la grille tracker — empêche le chevauchement inter-colonnes. */
export const TRACKER_GRID_CELL_GUARDRAIL_CLASS =
  "min-w-0 max-w-full overflow-x-clip overflow-y-visible isolate";

/** FR-combat-initiative-tracker — every value is left-aligned. Classes d'alignement par colonne (initiative, perso, pv, ca, état, groupe [, visibilité]). */
export const TRACKER_CELL_ALIGN = {
  initiative: "justify-self-start text-left",
  character: "justify-self-start text-left min-w-0",
  hitPoints: "justify-self-start text-left",
  armorClass: "justify-self-start text-left",
  condition: "justify-self-stretch text-left min-w-0",
  group: "justify-self-start text-left min-w-0",
  visible: "justify-self-start text-left",
} as const;

export const TRACKER_HEADER_ALIGN = {
  initiative: "text-left",
  character: "text-left",
  hitPoints: "text-left",
  armorClass: "text-left",
  condition: "text-left",
  group: "text-left",
  visible: "text-left",
} as const;
