import { useTranslations } from "next-intl";
import type { IdentityFact } from "@/components/character/tabContents/general/shared/CharacterIdentityCard";
import { formatChallengeRating } from "@/utils/challengeRating.utils";
import type { NPC } from "@/types/character";

export interface NpcIdentityFactLabels {
  type: string;
  challengeRating: string;
  alignment: string;
  /** Localized alignment name from its stored key. */
  alignmentName: (alignment: string) => string;
}

/**
 * NPC key fact cells of the read-mode « Personnage » card, also shown on Companions-tab cards:
 * Type (+ subtype) · Alignement · Facteur de puissance (+ XP). The challenge rating cell is
 * always rendered (CR `0` included).
 * @see FR-character-identity-card, FR-npc-player-link
 */
export function npcIdentityFacts(npc: NPC, labels: NpcIdentityFactLabels): IdentityFact[] {
  const experiencePoints = npc.challenge?.experiencePoints;
  const xp = typeof experiencePoints === "number" && Number.isFinite(experiencePoints) ? experiencePoints : 0;

  return [
    {
      key: "type",
      label: labels.type,
      value: npc.profile?.type,
      secondary: npc.profile?.subtype,
    },
    {
      key: "alignment",
      label: labels.alignment,
      value: npc.profile?.alignment ? labels.alignmentName(npc.profile.alignment) : undefined,
    },
    {
      key: "challengeRating",
      label: labels.challengeRating,
      value: formatChallengeRating(npc.challenge?.challengeRating),
      secondary: `${xp} XP`,
    },
  ];
}

/** Translated `npcIdentityFacts` for a component. */
export function useNpcIdentityFacts(npc: NPC): IdentityFact[] {
  const tPlayer = useTranslations("characterDetail.player");
  const tNpc = useTranslations("characterDetail.npc");
  const tAlignment = useTranslations("alignments");

  return npcIdentityFacts(npc, {
    type: tNpc("typeLabel"),
    challengeRating: tNpc("challengeRating"),
    alignment: tPlayer("alignment"),
    alignmentName: (alignment) => tAlignment(alignment),
  });
}
