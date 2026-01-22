export interface Campaign {
    _id: string;
    label: string;
    groups: {
        active: string[];
        archived: string[];
    };
    createdAt: string;
    updatedAt: string;
    deletedAt?: string | null;
}

export interface CampaignState {
    campaigns: Campaign[];
    loading: boolean;
    error: string | null;
    lastFetch: number | null;
}

export interface PaginatedCampaignsResponse {
    data: Campaign[];
    meta: {
        total: number;
        page: number;
        offset: number;
    };
}
