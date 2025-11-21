import IPlayer from "@/models/player/IPlayer";
import AbilityScores from "@/components/modules/characters/modals/panels/characteristics/sections/player/PlayerAbilityScoresSection";
import Appearance from "@/components/modules/characters/modals/panels/characteristics/sections/player/PlayerAppearanceSection";
import Background from "@/components/modules/characters/modals/panels/characteristics/sections/player/PlayerBackgroundSection";
import Battle from "@/components/modules/characters/modals/panels/characteristics/sections/player/PlayerFightingSection";
import Profile from "@/components/modules/characters/modals/panels/characteristics/sections/player/PlayerProfileSection";
import Treasure from "@/components/modules/characters/modals/panels/characteristics/sections/player/PlayerTreasureSection";

interface Props {
  player: IPlayer;
  updatePlayer: (player: IPlayer) => void;
  isUpdate: boolean;
}
export default function PlayerCharacteristicSection({ player, updatePlayer, isUpdate }: Props) {
  return (
    <div className="flex flex-row gap-3 h-[90%] overflow-auto">
      <AbilityScores
        updatePlayer={updatePlayer}
        isUpdate={isUpdate}
        player={player}
      />
      <div className="flex flex-col gap-3 w-1/6 h-full">
        {/* PV */}
        <Battle
          updatePlayer={updatePlayer}
          isUpdate={isUpdate}
          player={player}
        />

        {/* Profile + Progression */}
        <Profile
          updatePlayer={updatePlayer}
          isUpdate={isUpdate}
          player={player}
        />

        {/* Appareance */}
        <Appearance
          updatePlayer={updatePlayer}
          isUpdate={isUpdate}
          player={player}
        />
      </div>
      <div className="flex flex-col gap-3 w-4/6 h-full">
        {/* Background */}
        <Background
          updatePlayer={updatePlayer}
          isUpdate={isUpdate}
          player={player}
        />

        {/* Treasure */}
        <Treasure
          updatePlayer={updatePlayer}
          isUpdate={isUpdate}
          player={player}
        />
      </div>
    </div>
  );
}
