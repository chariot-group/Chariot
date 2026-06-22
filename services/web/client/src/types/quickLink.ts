export interface QuickLink {
  _id: string;
  icon: string;
  url: string;
  label: string;
  campaignId: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateQuickLinkDto {
  icon: string;
  url: string;
  label: string;
  campaignId?: string | null;
}

export interface UpdateQuickLinkDto {
  icon?: string;
  url?: string;
  label?: string;
}
