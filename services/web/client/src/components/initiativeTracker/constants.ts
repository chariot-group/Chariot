import type { ActiveInitiativeTrackerCondition } from "./types";
import { ROUND_DURATION_SECONDS } from "./conditionDuration";

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

export const TRACKER_GRID_TEMPLATE_COLUMNS =
  "88px minmax(160px, 1.25fr) 96px 56px minmax(130px, 0.85fr) minmax(120px, 0.75fr) 72px";

export const TRACKER_GRID_TEMPLATE_COLUMNS_WITH_SELECTION =
  "40px 88px minmax(160px, 1.25fr) 96px 56px minmax(130px, 0.85fr) minmax(120px, 0.75fr) 72px";

/** FR-015 — grille sans colonne visibilité MJ (vue joueur). */
export const PLAYER_TRACKER_GRID_TEMPLATE_COLUMNS =
  "88px minmax(160px, 1.25fr) 96px 56px minmax(130px, 0.85fr) minmax(120px, 0.75fr)";

/** Classes d'alignement par colonne (initiative, perso, pv, ca, état, groupe [, visibilité]). */
export const TRACKER_CELL_ALIGN = {
  initiative: "justify-self-center text-center",
  character: "justify-self-start text-left min-w-0",
  hitPoints: "justify-self-center text-center",
  armorClass: "justify-self-center text-center",
  condition: "justify-self-start text-left min-w-0",
  group: "justify-self-start text-left min-w-0",
  visible: "justify-self-center text-center",
} as const;

export const TRACKER_HEADER_ALIGN = {
  initiative: "text-center",
  character: "text-left",
  hitPoints: "text-center",
  armorClass: "text-center",
  condition: "text-left",
  group: "text-left",
  visible: "text-center",
} as const;

