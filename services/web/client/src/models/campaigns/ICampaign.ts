import { IGroup } from "@/models/groups/IGroup";

export interface ICampaign {
  _id: string;
  label: string;
  description: string;
  groups: {
    main: string[];
    npc: string[];
    archived: string[];
    _id: string;
  };
  deletedAt: null | Date;
  createdAt: Date;
  updatedAt: Date;
  __v: number;
}

export interface ICampaignUpdated {
  _id: string;
  label: string;
  description: string;
  groups: {
    main: IGroup[];
    npc: IGroup[];
    archived: IGroup[];
    _id: string;
  };
  deletedAt: null | Date;
  createdAt: Date;
  updatedAt: Date;
  __v: number;
}
