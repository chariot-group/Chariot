import ICharacter from "@/models/characters/ICharacter";

export interface IParticipant {
  character: ICharacter;
  groupLabel: string;
  initiative: number | undefined;
}
