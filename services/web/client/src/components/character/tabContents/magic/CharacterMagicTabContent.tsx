import { Character, NPC, Player } from "@/types/character";
import CharacterMagicView from "@/components/character/tabContents/magic/view/CharacterMagicView";
import { LazyCharacterMagicTabEdit as CharacterMagicTabEdit } from "@/components/lazy/lazyCharacterEditForms";
import { UseFormReturn, FieldValues } from "react-hook-form";
import { useState } from "react";
import {
  INITIAL_MAGIC_SELECTION,
  type MagicSelection,
} from "@/components/character/tabContents/magic/shared/useMagicSelection";

interface CharacterMagicTabContentProps {
  character: Character;
  accentColor: string;
  form: UseFormReturn<FieldValues>;
  isEditing: boolean;
  onCharacterUpdate?: (updated?: Player | NPC) => void;
}

export default function CharacterMagicTabContent({
  character,
  accentColor,
  form,
  isEditing,
  onCharacterUpdate,
}: CharacterMagicTabContentProps) {
  // Kept here so the selected block / spell survives switching between read and edit modes.
  const selectionState = useState<MagicSelection>(INITIAL_MAGIC_SELECTION);

  if (isEditing) {
    return (
      <CharacterMagicTabEdit
        character={character}
        accentColor={accentColor}
        form={form as unknown as UseFormReturn<Character>}
        selectionState={selectionState}
      />
    );
  }

  return (
    <CharacterMagicView
      character={character}
      accentColor={accentColor}
      onCharacterUpdate={onCharacterUpdate}
      selectionState={selectionState}
    />
  );
}
