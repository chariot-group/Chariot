import { SESSION_PARTICIPANT_NAME_LOADING } from "@/lib/formatSessionParticipantUserLabel";

export type SessionCharacterNameSource = {
  firstname?: string | null;
  lastname?: string | null;
  surname?: string | null;
};

/**
 * Human-readable character name for session surfaces (lobby, GM sidebar).
 * Never returns a technical id.
 * @see FR-session-participant-labels — Assigned Character Identity
 */
export function formatSessionCharacterDisplayName(
  source: SessionCharacterNameSource | null | undefined,
): string | null {
  if (!source) {
    return null;
  }

  const first = source.firstname?.trim() ?? "";
  const last = source.lastname?.trim() ?? "";
  const full = [first, last].filter(Boolean).join(" ");
  if (full) {
    return full;
  }

  const surname = source.surname?.trim() ?? "";
  if (surname && surname !== SESSION_PARTICIPANT_NAME_LOADING) {
    return surname;
  }

  return null;
}

/** Resolved label for UI: name when known, otherwise loading placeholder (never Mongo id). */
export function resolveSessionCharacterLabel(
  source: SessionCharacterNameSource | null | undefined,
): string {
  return formatSessionCharacterDisplayName(source) ?? SESSION_PARTICIPANT_NAME_LOADING;
}
