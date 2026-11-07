import { NPC, Player } from "@/types/character";
import CharacterInventoryView from "@/components/character/tabContents/inventory/view/CharacterInventoryView";
import { LazyCharacterInventoryTabEdit as CharacterInventoryTabEdit } from "@/components/lazy/lazyCharacterEditForms";
import { UseFormReturn, FieldValues } from "react-hook-form";

interface CharacterInventoryTabContentProps {
  accentColor: string;
  character: Player | NPC;
  form: UseFormReturn<FieldValues>;
  isEditing: boolean;
  onCharacterUpdate?: (updated?: Player | NPC) => void;
}

export default function CharacterInventoryTabContent({
  accentColor,
  character,
  form,
  isEditing,
  onCharacterUpdate,
}: CharacterInventoryTabContentProps) {
  if (isEditing) {
    return (
      <CharacterInventoryTabEdit
        accentColor={accentColor}
        form={form}
      />
    );
  }

  return (
    <CharacterInventoryView
      accentColor={accentColor}
      character={character}
      onCharacterUpdate={onCharacterUpdate}
    />
  );
}
