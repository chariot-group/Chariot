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

export const TRACKER_GRID_TEMPLATE_COLUMNS =
  "minmax(44px, 112px) minmax(52px, 132px) minmax(92px, 1.15fr) minmax(64px, 88px) minmax(40px, 52px) minmax(88px, 0.95fr) minmax(0, 0.9fr)";

export const TRACKER_GRID_TEMPLATE_COLUMNS_WITH_SELECTION =
  "32px minmax(44px, 112px) minmax(52px, 132px) minmax(92px, 1.15fr) minmax(64px, 88px) minmax(40px, 52px) minmax(88px, 0.95fr) minmax(0, 0.9fr)";

/** FR-session-combat-navigation — grille sans colonne visibilité MJ (vue joueur). */
export const PLAYER_TRACKER_GRID_TEMPLATE_COLUMNS =
  "minmax(52px, 132px) minmax(92px, 1.15fr) minmax(64px, 88px) minmax(40px, 52px) minmax(88px, 0.95fr) minmax(0, 0.9fr)";

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
