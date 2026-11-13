export interface QuickLink {
  _id: string;
  icon: string;
  url: string;
  label: string;
  campaignId: string | null;
  visibleInAllCampaigns?: boolean;
  visibleInPlayerSpace?: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateQuickLinkDto {
  icon: string;
  url: string;
  label: string;
  campaignId?: string | null;
  visibleInAllCampaigns?: boolean;
  visibleInPlayerSpace?: boolean;
}

export interface UpdateQuickLinkDto {
  icon?: string;
  url?: string;
  label?: string;
  visibleInAllCampaigns?: boolean;
  visibleInPlayerSpace?: boolean;
}
