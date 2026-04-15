import { NPC, Player } from "@/types/character";
import PlayerGeneralTabContent from "@/components/character/tabContents/general/view/PlayerGeneralTabContent";
import NpcGeneralTabContent from "@/components/character/tabContents/general/view/NpcGeneralTabContent";
import PlayerGeneralTabEdit from "@/components/character/tabContents/general/form/PlayerGeneralTabEdit";
import NpcGeneralTabEdit from "@/components/character/tabContents/general/form/NpcGeneralTabEdit";
import { UseFormReturn, FieldValues } from "react-hook-form";

interface CharacterGeneralTabContentProps {
  character: Player | NPC;
  accentColor: string;
  form: UseFormReturn<FieldValues>;
  isEditing: boolean;
}

export default function CharacterGeneralTabContent({ character, accentColor, form, isEditing }: CharacterGeneralTabContentProps) {
  // Mode édition
  if (isEditing) {
    if ("progression" in character) {
      return (
        <PlayerGeneralTabEdit
          player={character as Player}
          accentColor={accentColor}
          form={form}
        />
      );
    } else {
      return (
        <NpcGeneralTabEdit
          npc={character as NPC}
          accentColor={accentColor}
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
      />
    );
  } else {
    return (
      <NpcGeneralTabContent
        npc={character as NPC}
        accentColor={accentColor}
      />
    );
  }
}
