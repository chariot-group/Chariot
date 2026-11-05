import {
  resolveCharacterSheetSkeletonVariant,
  type CharacterSheetSkeletonVariant,
} from "@/components/character/skeleton/characterSheetSkeletonLayout";

export type AuthSkeletonContent = { type: "sheet"; variant: CharacterSheetSkeletonVariant } | { type: "generic" };

/** `/{locale}/characters/{id}` */
const PLAYER_SPACE_SHEET = /^\/[^/]+\/characters\/[^/]+\/?$/;
/** `/{locale}/campaigns/{id}/groups/{id}/characters/{id}` */
const CAMPAIGN_SHEET = /^\/[^/]+\/campaigns\/[^/]+\/groups\/[^/]+\/characters\/[^/]+\/?$/;

/**
 * Content area of the authentication skeleton, from the URL only (no store, no API):
 * the character sheet skeleton on sheet routes, a neutral placeholder elsewhere.
 * @see FR-auth-loading-skeleton
 */
export function resolveAuthSkeletonContent(
  pathname: string | null | undefined,
  requestedTab: string | null | undefined,
): AuthSkeletonContent {
  const path = pathname ?? "";
  if (CAMPAIGN_SHEET.test(path)) {
    return { type: "sheet", variant: resolveCharacterSheetSkeletonVariant("campaign", requestedTab) };
  }
  if (PLAYER_SPACE_SHEET.test(path)) {
    return { type: "sheet", variant: resolveCharacterSheetSkeletonVariant("playerSpace", requestedTab) };
  }
  return { type: "generic" };
}
