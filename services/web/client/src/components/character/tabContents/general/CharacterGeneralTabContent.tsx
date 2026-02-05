import { NPC, Player } from "@/types/character";
import PlayerGeneralTabContent from "@/components/character/tabContents/general/PlayerGeneralTabContent";
import NpcGeneralTabContent from "@/components/character/tabContents/general/NpcGeneralTabContent";

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
      <NpcGeneralTabContent
        npc={character as NPC}
        accentColor={accentColor}
      />
    );
  }
}
