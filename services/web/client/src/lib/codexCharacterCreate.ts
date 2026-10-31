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

/** @see FR-codex-share-link-preselection */
export type CodexPreselectionKind = "player" | "monster";

export interface CodexPreselection {
  kind: CodexPreselectionKind;
  id: string;
  /** Requested preview language from the link (`lang` query), when supported. */
  lang: string | null;
}

const CODEX_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;
const CODEX_PREVIEW_LANGS = ["fr", "en", "es"] as const;

/**
 * Validates the share-link params. Returns null (→ normal Codex search) when `kind` or
 * `codexId` is missing/invalid; an unsupported `lang` is dropped, not fatal.
 * @see FR-codex-share-link-preselection
 */
export function parseCodexPreselection(
  codexId: string | null | undefined,
  kind: string | null | undefined,
  lang: string | null | undefined,
): CodexPreselection | null {
  const id = codexId?.trim();
  if (!id || !CODEX_ID_PATTERN.test(id)) return null;
  if (kind !== "player" && kind !== "monster") return null;
  const requestedLang = lang?.trim().toLowerCase() ?? "";
  return {
    kind,
    id,
    lang: (CODEX_PREVIEW_LANGS as readonly string[]).includes(requestedLang) ? requestedLang : null,
  };
}

/** Link `lang` if the entry has it, else the user's locale, else `en`, else its first language. */
export function resolvePreselectionLang(args: {
  requested: string | null;
  userLocale: string;
  available: string[];
}): string | null {
  const { requested, userLocale, available } = args;
  if (requested && available.includes(requested)) return requested;
  if (available.includes(userLocale)) return userLocale;
  if (available.includes("en")) return "en";
  return available[0] ?? null;
}

/** Path of the Player-space Codex create flow, optionally for one entry (shareable). */
export function buildCodexPreselectionPath(
  locale: string,
  selection?: { kind: CodexPreselectionKind; id: string; lang?: string | null } | null,
): string {
  const base = `/${locale}/characters/new/codex`;
  if (!selection) return base;
  return withQuery(`${base}/${encodeURIComponent(selection.id)}`, {
    kind: selection.kind,
    lang: selection.lang,
  });
}

/**
 * Whether closing the Codex dialog must leave the route for the user's Player space.
 * Only for an opened share link in Player space: there is no history to go back to. Other flows keep `router.back()`.
 */
export function shouldRedirectOnCodexClose(flow: {
  context?: unknown;
  linkedPlayerId?: string | null;
  fromShareLink: boolean;
}): boolean {
  return flow.fromShareLink && !flow.context && !flow.linkedPlayerId?.trim();
}

/** Parses the dialog's `kind:id:lang` selection key (see MonsterCodexDialog). */
export function parseCodexSelectionKey(
  key: string | null,
): { kind: CodexPreselectionKind; id: string; lang: string | null } | null {
  if (!key) return null;
  const [kind, id, lang] = key.split(":");
  if ((kind !== "player" && kind !== "monster") || !id) return null;
  return { kind, id, lang: lang || null };
}
