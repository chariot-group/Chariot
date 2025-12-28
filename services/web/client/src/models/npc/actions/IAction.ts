import IDamage from "@/models/npc/actions/IDamage";

export default interface IAction {
  name?: string;
  type?: string;
  attackBonus?: number;
  damage: IDamage;
  range?: string;
}
