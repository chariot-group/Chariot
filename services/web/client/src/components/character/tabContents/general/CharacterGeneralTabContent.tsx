import { NPC, Player } from "@/types/character";
import PlayerGeneralTabContent from "@/components/character/tabContents/general/view/PlayerGeneralTabContent";
import NpcGeneralTabContent from "@/components/character/tabContents/general/view/NpcGeneralTabContent";
import PlayerGeneralTabEdit from "@/components/character/tabContents/general/form/PlayerGeneralTabEdit";
import NpcGeneralTabEdit from "@/components/character/tabContents/general/form/NpcGeneralTabEdit";
import { UseFormReturn, FieldValues } from "react-hook-form";
import type { ReactNode } from "react";

interface CharacterGeneralTabContentProps {
  character: Player | NPC;
  accentColor: string;
  form: UseFormReturn<FieldValues>;
  isEditing: boolean;
  onCharacterUpdate?: (updated?: Player | NPC) => void;
  /** Rendered in the « Personnage » card. @see FR-character-detail-view */
  avatar?: ReactNode;
}

export default function CharacterGeneralTabContent({
  character,
  accentColor,
  form,
  isEditing,
  onCharacterUpdate,
  avatar,
}: CharacterGeneralTabContentProps) {
  // Mode édition
  if (isEditing) {
    if ("progression" in character) {
      return (
        <PlayerGeneralTabEdit
          player={character as Player}
          accentColor={accentColor}
          avatar={avatar}
          form={form}
        />
      );
    } else {
      return (
        <NpcGeneralTabEdit
          npc={character as NPC}
          accentColor={accentColor}
          avatar={avatar}
          form={form}
        />
      );
    }
  }

  // Mode lecture
  if ("progression" in character) {
    return (
      <PlayerGeneralTabContent
        player={character as Player}
        accentColor={accentColor}
        avatar={avatar}
        onCharacterUpdate={onCharacterUpdate}
      />
    );
  } else {
    return (
      <NpcGeneralTabContent
        npc={character as NPC}
        accentColor={accentColor}
        avatar={avatar}
        onCharacterUpdate={onCharacterUpdate}
      />
    );
  }
}
