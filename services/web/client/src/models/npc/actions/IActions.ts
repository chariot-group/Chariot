import IAction from "@/models/npc/actions/IAction";

export default interface IActions {
  standard: IAction[];
  legendary: IAction[];
  lair: IAction[];
}
