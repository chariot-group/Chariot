import { Character, Player, NPC } from "@/types/character";
import PlayerBattleTabContent from "@/components/character/tabContents/battle/view/PlayerBattleTabContent";
import NPCBattleTabContent from "@/components/character/tabContents/battle/view/NPCBattleTabContent";
import PlayerBattleTabEdit from "@/components/character/tabContents/battle/form/PlayerBattleTabEdit";
import NPCBattleTabEdit from "@/components/character/tabContents/battle/form/NPCBattleTabEdit";
import { UseFormReturn, FieldValues } from "react-hook-form";

interface Props {
    character: Character;
    accentColor: string;
    form: UseFormReturn<FieldValues>;
    isEditing: boolean;
}

const isPlayer = (character: Character): character is Player => {
    return 'progression' in character && 'class' in character && 'profile' in character;
}

const isNPC = (character: Character): character is NPC => {
    return 'actions' in character && 'challenge' in character && 'profile' in character;
}

const CharacterBattleTabContent = ({ character, accentColor, form, isEditing }: Props) => {

    // Mode édition
    if (isEditing) {
        if (isPlayer(character)) {
            return <PlayerBattleTabEdit player={character} accentColor={accentColor} form={form} />;
        } else if (isNPC(character)) {
            return <NPCBattleTabEdit npc={character} accentColor={accentColor} form={form} />;
        }
    }

    // Mode lecture
    if (isPlayer(character)) {
        return <PlayerBattleTabContent player={character} accentColor={accentColor} />;
    } else if (isNPC(character)) {
        return <NPCBattleTabContent npc={character} accentColor={accentColor} />;
    }

}

export default CharacterBattleTabContent
