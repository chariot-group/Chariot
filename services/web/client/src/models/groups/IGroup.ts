import { ICampaign } from "@/models/campaigns/ICampaign";
import ICharacter from "@/models/characters/ICharacter";

export interface IGroup {
  _id: string;
  label: string;
  description: string;
  characters: string[];
  campaigns: string[];
  deletedAt: null | Date;
  createdAt: Date;
  updatedAt: Date;
  __v: number;
}

export interface IGroupWithRelations {
  _id: string;
  label: string;
  description: string;
  characters: ICharacter[];
  campaigns: ICampaign[];
  deletedAt: null | Date;
  createdAt: Date;
  updatedAt: Date;
  __v: number;
}
