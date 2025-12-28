import { ICampaign } from "@/models/campaigns/ICampaign";

export interface IUser {
  _id: string;
  username: string;
  email: string;
  campaigns: ICampaign[];
}
