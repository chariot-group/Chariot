import { Player } from "@/types/character";
import PlayerBattleTabContent from "@/components/character/tabContents/battle/view/PlayerBattleTabContent";
import PlayerBattleTabEdit from "@/components/character/tabContents/battle/form/PlayerBattleTabEdit";
import { UseFormReturn, FieldValues } from "react-hook-form";

interface CharacterBattleTabContentProps {
  character: Player;
  accentColor: string;
  form: UseFormReturn<FieldValues>;
  isEditing: boolean;
}

export default function CharacterBattleTabContent({ character, accentColor, form, isEditing }: CharacterBattleTabContentProps) {
  if (isEditing) {
    return <PlayerBattleTabEdit player={character} accentColor={accentColor} form={form} />;
  }

  return <PlayerBattleTabContent player={character} accentColor={accentColor} />;
}
