import { IGroup } from "@/models/groups/IGroup";
import IAffinities from "@/models/characters/affinities/IAffinities";
import ISpellcasting from "@/models/characters/spellcasting/ISpellcasting";
import IAbility from "@/models/characters/abilities/IAbility";
import IStatsBase from "@/models/npc/stat/IStatsBase";

export default interface ICharacter<TStats extends IStatsBase = IStatsBase> {
  _id: string;
  name: string;
  kind: "npc" | "player";
  affinities: IAffinities;
  abilities: IAbility[];
  spellcasting: ISpellcasting[];
  groups: IGroup[] | string[];
  stats: TStats;
  deletedAt?: Date;
}
