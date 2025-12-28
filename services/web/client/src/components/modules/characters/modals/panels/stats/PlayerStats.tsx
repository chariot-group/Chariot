import IPlayer from "@/models/player/IPlayer";
import Details from "@/components/modules/characters/modals/panels/stats/sections/player/PlayerDetailsSection";
import Speed from "@/components/modules/characters/modals/panels/stats/sections/player/PlayerSpeedSection";
import Languages from "@/components/modules/characters/modals/panels/stats/sections/player/PlayerLanguagesSection";
import CharacterSensesSection from "@/components/modules/characters/modals/panels/stats/sections/CharacterSensesSection";
import Classes from "@/components/modules/characters/modals/panels/stats/sections/CharacterClassesSection";
import Skills from "@/components/modules/characters/modals/panels/stats/sections/player/PlayerSkillsSection";

interface Props {
  player: IPlayer;
  isUpdate: boolean;
  updatePlayer: (player: IPlayer) => void;
}
export default function PlayerStats({ player, isUpdate, updatePlayer }: Props) {
  return (
    <div className="flex flex-row gap-3 h-[90%] overflow-auto">
      <div className="flex flex-col gap-3 w-1/6 h-full">
        <Details
          updatePlayer={updatePlayer}
          isUpdate={isUpdate}
          player={player}
        />
        <Speed
          updatePlayer={updatePlayer}
          isUpdate={isUpdate}
          player={player}
        />
        <Languages
          updatePlayer={updatePlayer}
          isUpdate={isUpdate}
          player={player}
        />
      </div>
      <div className="flex flex-col gap-3 w-1/6 h-full">
        <Skills
          updatePlayer={updatePlayer}
          isUpdate={isUpdate}
          player={player}
        />
        <CharacterSensesSection
          updateCharacter={(player) => updatePlayer(player as IPlayer)}
          isUpdate={isUpdate}
          character={player}
        />
      </div>
      <div className="flex flex-col gap-3 h-full border border-ring"></div>
      <div className="flex flex-col gap-3 w-4/6 h-full">
        <Classes
          updatePlayer={updatePlayer}
          isUpdate={isUpdate}
          player={player}
        />
      </div>
    </div>
  );
}
