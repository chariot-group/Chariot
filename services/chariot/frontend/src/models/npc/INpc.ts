import ICharacter from "@/models/characters/ICharacter";
import IActions from "@/models/npc/actions/IActions";
import IChallenge from "@/models/npc/challenge/IChallenge";
import IProfile from "@/models/npc/profile/IProfile";
import IStatsBase from "@/models/npc/stat/IStatsBase";

export default interface INpc extends ICharacter<IStatsBase> {
  actions: IActions;
  challenge: IChallenge;
  profile?: IProfile;
}
