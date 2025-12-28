import IProgression from "@/models/player/progression/IProgression";
import IClass from "@/models/player/class/IClass";
import IProfile from "@/models/player/profile/IProfile";
import IAppearance from "@/models/player/appearance/IAppearance";
import IBackground from "@/models/player/background/IBackground";
import ITreasure from "@/models/player/treasure/ITreasure";
import IStats from "@/models/player/stats/IStats";
import ICharacter from "@/models/characters/ICharacter";

export default interface IPlayer extends ICharacter<IStats> {
  inspiration: boolean;
  progression: IProgression;
  class: IClass[];
  profile: IProfile;
  appearance: IAppearance;
  background: IBackground;
  treasure: ITreasure;
}
