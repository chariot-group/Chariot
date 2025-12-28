import IStatsBase from "@/models/npc/stat/IStatsBase";
import IMastery from "@/models/player/stats/IMastery";
import IMasteryAbility from "@/models/player/stats/IMasteryAbility";

export default interface IStats extends IStatsBase {
  proficiencyBonus: number;
  masteries: IMastery;
  masteriesAbility: IMasteryAbility;
}
