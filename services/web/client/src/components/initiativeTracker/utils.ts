import type { Character, Player } from "@/types/character";
import type { BattleStateSnapshot, InitiativeTrackerRow } from "@/store/slices/sessionSlice";
import { isPlayer } from "@/utils/global.utils";
import { SESSION_PARTICIPANTS_GROUP_ID } from "@/components/initiativeTracker/constants";

/**
 * FR-020 — seuil d'\u00e9checs aux jets de mort \u00e0 partir duquel un PJ \u00e0 0 PV est consid\u00e9r\u00e9 mort.
 */
export const DEATH_SAVES_FAILURE_THRESHOLD = 3;

export type InitiativeTrackerRowStatus = "alive" | "unconscious" | "dead";

export function trackerHpFromCharacter(
  character: Character,
): Pick<InitiativeTrackerRow, "hitPoints" | "maxHitPoints" | "tempHitPoints"> {
  const stats = character.stats;
  return {
    hitPoints: Number.isFinite(stats?.currentHitPoints)
      ? Number(stats.currentHitPoints)
      : Number(stats?.maxHitPoints ?? 0),
    maxHitPoints: Number.isFinite(stats?.maxHitPoints) ? Number(stats.maxHitPoints) : 0,
    tempHitPoints: Number.isFinite(stats?.tempHitPoints) ? Number(stats.tempHitPoints) : 0,
  };
}

/**
 * FR-020 — calcule l'\u00e9tat vital d'une ligne tracker \u00e0 partir des PV et des death saves miroir\u00e9s.
 * - NPC \u00e0 0 PV \u2192 dead.
 * - PJ \u00e0 0 PV avec failures >= 3 \u2192 dead.
 * - PJ \u00e0 0 PV avec failures < 3 \u2192 unconscious.
 * - Tout le reste \u2192 alive.
 */
export function getInitiativeTrackerRowStatus(
  row: Pick<InitiativeTrackerRow, "hitPoints" | "kind" | "deathSavesFailures">,
): InitiativeTrackerRowStatus {
  const hp = Number.isFinite(row.hitPoints) ? Number(row.hitPoints) : 0;
  if (hp > 0) return "alive";

  if (row.kind === "player") {
    const failures = Number.isFinite(row.deathSavesFailures) ? Number(row.deathSavesFailures) : 0;
    return failures >= DEATH_SAVES_FAILURE_THRESHOLD ? "dead" : "unconscious";
  }

  return "dead";
}

/**
 * FR-020 — extrait `deathSavesFailures` d'un personnage si c'est un PJ, sinon retourne `0`.
 * Sert au seed initial et aux refresh post HP/remote sync.
 */
export function trackerDeathSavesFailuresFromCharacter(character: Character): number {
  if (!isPlayer(character)) return 0;
  const failures = (character as Player).deathSaves?.failures;
  return Number.isFinite(failures) ? Math.max(0, Math.floor(Number(failures))) : 0;
}

/**
 * FR-020 — d\u00e9termine le `kind` d'une ligne tracker pour un personnage charg\u00e9.
 */
export function trackerKindFromCharacter(character: Character): InitiativeTrackerRow["kind"] {
  return isPlayer(character) ? "player" : "npc";
}

/**
 * FR-020 — calcule l'ensemble des champs miroir pertinents pour le statut vital d'une ligne tracker
 * (HP + d\u00e9rivation mort/inconscient). Utilis\u00e9 apr\u00e8s un refetch personnage (HP dialog ou WS sync).
 */
export function trackerStatusFieldsFromCharacter(
  character: Character,
): Pick<InitiativeTrackerRow, "hitPoints" | "maxHitPoints" | "tempHitPoints" | "kind" | "deathSavesFailures"> {
  return {
    ...trackerHpFromCharacter(character),
    kind: trackerKindFromCharacter(character),
    deathSavesFailures: trackerDeathSavesFailuresFromCharacter(character),
  };
}

/**
 * FR-022 — miroir complet des champs de fiche affichés dans le tracker.
 * Utilisé lors d'un refresh temps réel de fiche pour resynchroniser toutes les lignes concernées.
 */
export function trackerMirrorFieldsFromCharacter(
  character: Character,
): Pick<
  InitiativeTrackerRow,
  | "firstname"
  | "lastname"
  | "surname"
  | "avatar"
  | "armorClass"
  | "hitPoints"
  | "maxHitPoints"
  | "tempHitPoints"
  | "kind"
  | "deathSavesFailures"
> {
  return {
    firstname: character.firstname ?? "",
    lastname: character.lastname ?? "",
    surname: character.surname ?? "",
    avatar: character.avatar ?? "",
    armorClass: Number.isFinite(character.stats?.armorClass) ? Number(character.stats.armorClass) : 0,
    ...trackerStatusFieldsFromCharacter(character),
  };
}

export function characterName(firstname: string, lastname: string, surname: string): string {
  const fullName = `${firstname ?? ""} ${lastname ?? ""}`.trim();
  return fullName || surname || "-";
}

export function clampConditionIndex(index: number, length: number) {
  if (length === 0) return -1;
  return Math.max(0, Math.min(index, length - 1));
}

export function sortInitiativeTrackerRows(rows: InitiativeTrackerRow[]): InitiativeTrackerRow[] {
  return [...rows].sort((a, b) => b.initiative - a.initiative || a.groupLabel.localeCompare(b.groupLabel));
}

export function buildBattleTurnKey(round: number, rowId: string) {
  return `${round}:${rowId}`;
}

export function getPreviousBattleTurn(
  sortedRows: InitiativeTrackerRow[],
  currentRound: number,
  activeTurnRowId: string | null,
): { round: number; rowId: string } | null {
  if (!activeTurnRowId || sortedRows.length === 0) return null;

  const currentIndex = sortedRows.findIndex((row) => row.id === activeTurnRowId);
  const safeIndex = currentIndex >= 0 ? currentIndex : 0;

  if (safeIndex <= 0) {
    if (currentRound <= 1) return null;
    const rowId = sortedRows[sortedRows.length - 1]?.id;
    if (!rowId) return null;
    return { round: currentRound - 1, rowId };
  }

  const rowId = sortedRows[safeIndex - 1]?.id;
  if (!rowId) return null;
  return { round: currentRound, rowId };
}

export function isBattleTurnLocked(turnKey: string, turnsWithActions: string[]) {
  return turnsWithActions.includes(turnKey);
}

export function canUndoBattleTurn(
  sortedRows: InitiativeTrackerRow[],
  currentRound: number,
  activeTurnRowId: string | null,
  turnsWithActions: string[],
): boolean {
  const previousTurn = getPreviousBattleTurn(sortedRows, currentRound, activeTurnRowId);
  if (!previousTurn || !activeTurnRowId) return false;

  const currentKey = buildBattleTurnKey(currentRound, activeTurnRowId);

  if (isBattleTurnLocked(currentKey, turnsWithActions)) return false;

  return true;
}

/** FR-021 — groupe virtuel des joueurs connectés à la session. */
export function isSessionParticipantTrackerRow(
  row: Pick<InitiativeTrackerRow, 'groupId'>,
): boolean {
  return row.groupId === SESSION_PARTICIPANTS_GROUP_ID;
}

/** FR-021 — lignes visibles pour la vue joueur (participants session toujours inclus). */
export function filterRowsForPlayerView(rows: InitiativeTrackerRow[]): InitiativeTrackerRow[] {
  return rows.filter((row) => row.visible || isSessionParticipantTrackerRow(row));
}

/** FR-021 / FR-022 — retire du snapshot temps réel les données que les joueurs ne peuvent pas voir. */
export function sanitizeInitiativeTrackerRowForPlayer(row: InitiativeTrackerRow): InitiativeTrackerRow {
  const fieldVis = row.playerFieldVisibility;
  return {
    ...row,
    firstname: fieldVis.name ? row.firstname : "",
    lastname: fieldVis.name ? row.lastname : "",
    surname: fieldVis.name ? row.surname : "",
    initiative: fieldVis.initiative ? row.initiative : 0,
    // Quand lifeStatus est visible mais pas les HP, on transmet un HP signé
    // (≤ 0 si mort/inconscient, 1 sinon) sans révéler la valeur exacte.
    hitPoints: fieldVis.hitPoints
      ? row.hitPoints
      : fieldVis.lifeStatus
        ? Math.min(row.hitPoints, 1)
        : 1,
    maxHitPoints: fieldVis.hitPoints ? row.maxHitPoints : 0,
    tempHitPoints: fieldVis.hitPoints ? row.tempHitPoints : 0,
    armorClass: fieldVis.armorClass ? row.armorClass : 0,
    conditions: fieldVis.conditions ? row.conditions : [],
    groupLabel: fieldVis.groupLabel ? row.groupLabel : "",
    deathSavesFailures: fieldVis.hitPoints
      ? row.deathSavesFailures
      : fieldVis.lifeStatus
        ? row.deathSavesFailures
        : 0,
  };
}

export function sanitizeBattleStateSnapshotForPlayers(snapshot: BattleStateSnapshot): BattleStateSnapshot {
  const initiativeTrackerRows = filterRowsForPlayerView(sortInitiativeTrackerRows(snapshot.initiativeTrackerRows)).map(
    sanitizeInitiativeTrackerRowForPlayer,
  );
  const activeTurnVisible = snapshot.activeTurnRowId
    ? initiativeTrackerRows.some((row) => row.id === snapshot.activeTurnRowId)
    : false;

  return {
    ...snapshot,
    initiativeTrackerRows,
    activeTurnRowId: activeTurnVisible ? snapshot.activeTurnRowId : null,
  };
}

/** FR-021 — alias par défaut = nom réel du personnage sur la ligne tracker. */
export function defaultPlayerDisplayNameForRow(
  row: Pick<InitiativeTrackerRow, "firstname" | "lastname" | "surname">,
): string {
  return characterName(row.firstname, row.lastname, row.surname);
}

/** FR-021 — valeur persistée à l'enregistrement (vide → nom réel). */
export function resolvePlayerDisplayNameForSave(raw: string, gmName: string): string {
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : gmName;
}

/** FR-021 — sous-titre MJ lorsque l'alias joueur diffère du nom réel. */
export function shouldShowGmPlayerAliasSubtitle(gmName: string, playerDisplayName: string): boolean {
  const alias = playerDisplayName.trim();
  return alias.length > 0 && alias !== gmName.trim();
}

/** FR-021 / FR-019 — nom affiché côté joueur selon visibilité et override MJ. */
export function resolvePlayerTrackerDisplayName(
  row: Pick<InitiativeTrackerRow, 'firstname' | 'lastname' | 'surname' | 'playerDisplayName' | 'playerFieldVisibility'>,
): string | null {
  const realName = characterName(row.firstname, row.lastname, row.surname);
  const displayName = row.playerDisplayName?.trim();

  if (row.playerFieldVisibility.name) {
    return displayName.length > 0 ? displayName : realName;
  }

  return displayName.length > 0 ? displayName : null;
}
