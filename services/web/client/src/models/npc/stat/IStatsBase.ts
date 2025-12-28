import { Size } from "@/constants/CharacterConstants";
import IAbilityScores from "@/models/npc/stat/sub/IAbilityScores";
import ISavingThrows from "@/models/npc/stat/sub/ISavingThrows";
import ISense from "@/models/npc/stat/sub/ISenses";
import ISkills from "@/models/npc/stat/sub/ISkills";
import ISpeed from "@/models/npc/stat/sub/ISpeed";

export default interface IStatsBase {
  size: Size;
  maxHitPoints: number;
  currentHitPoints: number;
  tempHitPoints: number;
  armorClass: number;
  speed: ISpeed;
  abilityScores: IAbilityScores;
  languages: string[];
  passivePerception: number;
  savingThrows: ISavingThrows;
  skills: ISkills;
  senses: ISense[];
}
