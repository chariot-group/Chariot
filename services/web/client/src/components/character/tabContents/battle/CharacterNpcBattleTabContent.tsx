import { NPC } from "@/types/character";
import NPCBattleTabContent from "@/components/character/tabContents/battle/view/NPCBattleTabContent";
import NPCBattleTabEdit from "@/components/character/tabContents/battle/form/NPCBattleTabEdit";
import { UseFormReturn, FieldValues } from "react-hook-form";

interface CharacterNpcBattleTabContentProps {
  character: NPC;
  accentColor: string;
  form: UseFormReturn<FieldValues>;
  isEditing: boolean;
}

export default function CharacterNpcBattleTabContent({ character, accentColor, form, isEditing }: CharacterNpcBattleTabContentProps) {
  if (isEditing) {
    return <NPCBattleTabEdit npc={character} accentColor={accentColor} form={form} />;
  }

  return <NPCBattleTabContent npc={character} accentColor={accentColor} />;
}
