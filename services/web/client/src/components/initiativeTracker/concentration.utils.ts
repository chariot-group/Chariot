import { SESSION_PARTICIPANTS_GROUP_ID } from "@/components/initiativeTracker/constants";
import type { Spell, Spellcasting } from "@/types/character";
import type {
  InitiativeTrackerRow,
  PendingConcentrationCheck,
  TrackerConcentration,
} from "@/store/slices/sessionSlice";

/** FR-tracker-concentration — détection heuristique via le champ duration du sort. */
export function isConcentrationSpell(spell: Pick<Spell, "duration"> | null | undefined): boolean {
  const duration = spell?.duration?.trim();
  if (!duration) return false;
  return /concentration/i.test(duration);
}

/** FR-tracker-concentration — DC de sauvegarde de concentration D&D 5e. */
export function computeConcentrationSaveDc(damageAmount: number): number {
  const normalized = Math.max(0, Math.floor(damageAmount));
  return Math.max(10, Math.floor(normalized / 2));
}

export function effectiveTrackerHitPoints(
  row: Pick<InitiativeTrackerRow, "hitPoints" | "tempHitPoints">,
): number {
  return Math.max(0, row.hitPoints) + Math.max(0, row.tempHitPoints);
}

export function buildTrackerConcentration(input: {
  spellName: string;
  spellLevel?: number;
  className?: string;
  sinceRound?: number;
}): TrackerConcentration {
  const spellName = input.spellName.trim();
  return {
    spellName,
    ...(Number.isFinite(input.spellLevel) ? { spellLevel: Math.max(0, Math.floor(Number(input.spellLevel))) } : {}),
    ...(input.className?.trim() ? { className: input.className.trim() } : {}),
    ...(Number.isFinite(input.sinceRound)
      ? { sinceRound: Math.max(1, Math.floor(Number(input.sinceRound))) }
      : {}),
  };
}

export function normalizeTrackerConcentration(value: unknown): TrackerConcentration | null {
  if (!value || typeof value !== "object" || !("spellName" in value)) {
    return null;
  }

  const spellName = typeof value.spellName === "string" ? value.spellName.trim() : "";
  if (!spellName) return null;

  return buildTrackerConcentration({
    spellName,
    spellLevel: "spellLevel" in value ? Number(value.spellLevel) : undefined,
    className: "className" in value && typeof value.className === "string" ? value.className : undefined,
    sinceRound: "sinceRound" in value ? Number(value.sinceRound) : undefined,
  });
}

export function normalizePendingConcentrationCheck(value: unknown): PendingConcentrationCheck | null {
  if (!value || typeof value !== "object") return null;
  const damageAmount = "damageAmount" in value ? Number(value.damageAmount) : NaN;
  const dc = "dc" in value ? Number(value.dc) : NaN;
  if (!Number.isFinite(damageAmount) || damageAmount <= 0 || !Number.isFinite(dc) || dc < 1) {
    return null;
  }
  return {
    damageAmount: Math.floor(damageAmount),
    dc: Math.floor(dc),
  };
}

/** Libellé principal du badge : le nom du sort maintenu. */
export function formatConcentrationBadgeLabel(spellName: string): string {
  const normalized = spellName.trim();
  return normalized.length > 0 ? normalized : "—";
}

/** FR-tracker-concentration — la modale de jet CON est réservée au joueur sur sa ligne ; le MJ la garde pour les PNJ. */
export function shouldShowConcentrationSaveDialog(input: {
  row: Pick<
    InitiativeTrackerRow,
    "groupId" | "characterId" | "concentration" | "pendingConcentrationCheck"
  >;
  isGameMaster: boolean;
  ownCharacterId: string | null;
}): boolean {
  const { row, isGameMaster, ownCharacterId } = input;
  if (!row.concentration || !row.pendingConcentrationCheck) return false;

  const isPlayerRow = row.groupId === SESSION_PARTICIPANTS_GROUP_ID;
  if (isPlayerRow) {
    return !isGameMaster && ownCharacterId != null && row.characterId === ownCharacterId;
  }

  return isGameMaster;
}

const CONCENTRATION_SAVE_AUTO_SHOWN_STORAGE_KEY = "chariot:concentration-save-auto-shown";

export function buildPendingConcentrationCheckSignature(pending: PendingConcentrationCheck): string {
  return `${pending.damageAmount}:${pending.dc}`;
}

export function buildConcentrationSaveAutoShownKey(rowId: string, signature: string): string {
  return `${rowId}:${signature}`;
}

function canUseConcentrationSaveSessionStorage(): boolean {
  return typeof sessionStorage !== "undefined";
}

export function readConcentrationSaveAutoShownKeys(): Set<string> {
  if (!canUseConcentrationSaveSessionStorage()) return new Set();

  try {
    const raw = sessionStorage.getItem(CONCENTRATION_SAVE_AUTO_SHOWN_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? new Set(parsed.filter((value): value is string => typeof value === "string"))
      : new Set();
  } catch {
    return new Set();
  }
}

export function markConcentrationSaveAutoShown(rowId: string, signature: string): void {
  if (!canUseConcentrationSaveSessionStorage() || !signature) return;

  const keys = readConcentrationSaveAutoShownKeys();
  keys.add(buildConcentrationSaveAutoShownKey(rowId, signature));
  sessionStorage.setItem(CONCENTRATION_SAVE_AUTO_SHOWN_STORAGE_KEY, JSON.stringify([...keys]));
}

export function clearConcentrationSaveAutoShownKeys(): void {
  if (!canUseConcentrationSaveSessionStorage()) return;
  sessionStorage.removeItem(CONCENTRATION_SAVE_AUTO_SHOWN_STORAGE_KEY);
}

/** Évite de ré-afficher automatiquement une modale déjà proposée pour le même rappel (ex. retour sur la page). */
export function shouldAutoOpenConcentrationSaveDialog(rowId: string, signature: string): boolean {
  if (!signature) return false;
  return !readConcentrationSaveAutoShownKeys().has(buildConcentrationSaveAutoShownKey(rowId, signature));
}

/** FR-tracker-concentration — calcule un rappel de jet CON si les PV effectifs baissent. */
export function computeConcentrationCheckFromHpChange(
  previous: Pick<InitiativeTrackerRow, "hitPoints" | "tempHitPoints" | "concentration">,
  next: Pick<InitiativeTrackerRow, "hitPoints" | "tempHitPoints" | "concentration">,
): PendingConcentrationCheck | null {
  if (!previous.concentration || !next.concentration) return null;

  const damageAmount = effectiveTrackerHitPoints(previous) - effectiveTrackerHitPoints(next);
  if (damageAmount <= 0) return null;

  return {
    damageAmount,
    dc: computeConcentrationSaveDc(damageAmount),
  };
}

/** Compact round label for concentration badges (e.g. R3). */
export function formatConcentrationRoundLabel(sinceRound?: number): string | null {
  if (!Number.isFinite(sinceRound)) return null;
  return `R${Math.max(1, Math.floor(Number(sinceRound)))}`;
}

export function listConcentrationSpellsFromCharacter(
  spellcastingList: Spellcasting[] | undefined,
): Array<{ spell: Spell; className: string }> {
  if (!spellcastingList?.length) return [];

  const results: Array<{ spell: Spell; className: string }> = [];
  for (const spellcasting of spellcastingList) {
    for (const spell of spellcasting.spells ?? []) {
      if (isConcentrationSpell(spell)) {
        results.push({ spell, className: spellcasting.className });
      }
    }
  }

  return results.sort((left, right) => {
    const levelDelta = left.spell.level - right.spell.level;
    if (levelDelta !== 0) return levelDelta;
    return left.spell.name.localeCompare(right.spell.name, undefined, { sensitivity: "base" });
  });
}
