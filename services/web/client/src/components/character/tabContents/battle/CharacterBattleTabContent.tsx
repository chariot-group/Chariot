import { Character, Player, NPC } from "@/types/character";
import PlayerBattleTabContent from "@/components/character/tabContents/battle/PlayerBattleTabContent";
import NPCBattleTabContent from "@/components/character/tabContents/battle/NPCBattleTabContent";

interface Props {
    character: Character;
    accentColor: string;
}

const isPlayer = (character: Character): character is Player => {
    return 'progression' in character && 'class' in character && 'profile' in character;
}

const isNPC = (character: Character): character is NPC => {
    return 'actions' in character && 'challenge' in character && 'profile' in character;
}

const CharacterBattleTabContent = ({ character, accentColor }: Props) => {
    if (isPlayer(character)) {
        return <PlayerBattleTabContent player={character} accentColor={accentColor} />;
    } else if (isNPC(character)) {
        return <NPCBattleTabContent npc={character} accentColor={accentColor} />;
    }

}

export default CharacterBattleTabContent
