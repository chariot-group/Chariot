"use client";

import { CombatBanner } from "@/components/character/CombatBanner";
import CharacterSheetSkeleton, {
  SkeletonFooterActions,
} from "@/components/character/skeleton/CharacterSheetSkeleton";
import type { CharacterSheetSkeletonVariant } from "@/components/character/skeleton/characterSheetSkeletonLayout";
import { useAppSelector } from "@/store/hooks";
import { selectIsSessionLaunched } from "@/store/slices/sessionSlice";

type CharacterSheetLoadingProps = CharacterSheetSkeletonVariant & {
  characterId: string;
};

/**
 * Loading state of a character sheet route (FR-character-sheet-skeleton). In session, the real combat
 * footer stays on screen while the next sheet loads, so opening a sheet from the footer strip does not
 * make the footer vanish and come back (FR-session-combat-navigation).
 */
export function CharacterSheetLoading({ characterId, ...variant }: CharacterSheetLoadingProps) {
  const isSessionLaunched = useAppSelector(selectIsSessionLaunched);

  if (!isSessionLaunched) {
    return <CharacterSheetSkeleton {...variant} />;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <CharacterSheetSkeleton
        {...variant}
        hideFooter
      />
      <CombatBanner
        characterId={characterId}
        footerActions={<SkeletonFooterActions />}
      />
    </div>
  );
}
