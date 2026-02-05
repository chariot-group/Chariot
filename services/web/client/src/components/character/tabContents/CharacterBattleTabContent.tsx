import { Character, Player, NPC } from "@/types/character";
import BattlePlayerTabContent from "./BattlePlayerTabContent";
import BattleNPCTabContent from "./BattleNPCTabContent";

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
        return <BattlePlayerTabContent player={character} accentColor={accentColor} />;
    } else if (isNPC(character)) {
        return <BattleNPCTabContent npc={character} accentColor={accentColor} />;
    }

}

export default CharacterBattleTabContent
