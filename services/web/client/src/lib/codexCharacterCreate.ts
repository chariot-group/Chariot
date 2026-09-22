import type { NPC, Player } from "@/types/character";

/** @see FR-codex-npc-search-entity-type, FR-player-space-codex-character-creation */
export type CodexCreateSelection =
  | { kind: "npc"; draft: Partial<NPC> }
  | { kind: "player"; draft: Partial<Player> };

export type CreateCharacterChoice = "players" | "npcs" | "codex";

export interface CampaignCreateContext {
  campaignId: string;
  groupId: string;
}

export function campaignContextFromParams(
  campaignId?: string,
  groupId?: string,
): CampaignCreateContext | undefined {
  if (campaignId && groupId) {
    return { campaignId, groupId };
  }
  return undefined;
}

function withQuery(path: string, query: Record<string, string | null | undefined>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    const trimmed = value?.trim();
    if (trimmed) params.set(key, trimmed);
  }
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

export function buildCreateCharacterPath(
  type: CreateCharacterChoice,
  context?: CampaignCreateContext,
  options?: { linkedPlayerId?: string | null },
): string {
  const linkedPlayerId = options?.linkedPlayerId;
  if (context) {
    const segment = type === "codex" ? "npcs-codex" : type;
    return withQuery(
      `/campaigns/${context.campaignId}/groups/${context.groupId}/characters/new/${segment}`,
      { linkedPlayerId },
    );
  }
  const segment = type === "codex" ? "codex" : type;
  return withQuery(`/characters/new/${segment}`, { linkedPlayerId });
}

export function buildCodexDraftFormPath(
  kind: CodexCreateSelection["kind"],
  context?: CampaignCreateContext,
  options?: { linkedPlayerId?: string | null },
): string {
  const type = kind === "player" ? "players" : "npcs";
  const linkedPlayerId = kind === "npc" ? options?.linkedPlayerId : undefined;
  if (context) {
    return withQuery(
      `/campaigns/${context.campaignId}/groups/${context.groupId}/characters/new/${type}`,
      { fromCodex: "1", linkedPlayerId },
    );
  }
  return withQuery(`/characters/new/${type}`, { fromCodex: "1", linkedPlayerId });
}

/** Companions « create linked » locks Codex to monsters (kind-preserving). */
export function linkedCreateCodexEntityLock(
  linkedPlayerId?: string | null,
): "monsters" | undefined {
  return linkedPlayerId?.trim() ? "monsters" : undefined;
}

export function resolveCodexCreateSelection(args: {
  entryKind: "monster" | "player" | null;
  npcDraft: Partial<NPC> | null;
  playerDraft: Partial<Player> | null;
}): CodexCreateSelection | null {
  if (args.entryKind === "player" && args.playerDraft) {
    return { kind: "player", draft: args.playerDraft };
  }
  if (args.entryKind === "monster" && args.npcDraft) {
    return { kind: "npc", draft: args.npcDraft };
  }
  return null;
}
