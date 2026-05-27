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
  "122px minmax(220px, 1.1fr) 112px 70px minmax(240px, 1.15fr) minmax(210px, 0.9fr) 94px";

export const TRACKER_GRID_TEMPLATE_COLUMNS_WITH_SELECTION =
  "44px 122px minmax(220px, 1.1fr) 112px 70px minmax(240px, 1.15fr) minmax(210px, 0.9fr) 94px";
