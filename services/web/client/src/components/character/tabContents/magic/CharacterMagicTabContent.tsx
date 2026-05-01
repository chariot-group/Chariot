import { Character, NPC, Player } from "@/types/character";
import CharacterMagicView from "@/components/character/tabContents/magic/view/CharacterMagicView";
import CharacterMagicTabEdit from "@/components/character/tabContents/magic/form/CharacterMagicTabEdit";
import { UseFormReturn, FieldValues } from "react-hook-form";

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
  if (isEditing) {
    return (
      <CharacterMagicTabEdit
        character={character}
        accentColor={accentColor}
        form={form}
      />
    );
  }

  return (
    <CharacterMagicView
      character={character}
      accentColor={accentColor}
      onCharacterUpdate={onCharacterUpdate}
    />
  );
}
