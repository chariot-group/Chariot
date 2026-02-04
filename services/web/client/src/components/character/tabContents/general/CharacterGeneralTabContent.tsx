import { NPC, Player } from "@/types/character";
import PlayerGeneralTabContent from "./PlayerGeneralTabContent";

interface CharacterGeneralTabContentProps {
  character: Player | NPC;
  accentColor: string;
}

export default function CharacterGeneralTabContent({ character, accentColor }: CharacterGeneralTabContentProps) {
  if ("progression" in character) {
    return (
      <PlayerGeneralTabContent
        player={character as Player}
        accentColor={accentColor}
      />
    );
  } else {
    return (
      <div>
        <h1 className={accentColor}>
          NPC Character: {character.firstname} {character.lastname}
        </h1>
        {/* Additional NPC-specific details */}
      </div>
    );
  }
}
