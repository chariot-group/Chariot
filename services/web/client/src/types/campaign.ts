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

export interface Player {
    _id: string;
    name: string;
    characterId?: string;
    userId: string;
}

export interface Character {
    _id: string;
    name: string;
    userId: string;
}

export interface Group {
    _id: string;
    label: string;
    characters: Character[];
    campaignId: string;
    createdAt: string;
    updatedAt: string;
    deletedAt?: string | null;
}

export interface GroupState {
    activeGroups: Group[];
    archivedGroups: Group[];
    loading: boolean;
    error: string | null;
    openGroupId: string | null;
}

export interface CampaignState {
    campaigns: Campaign[];
    loading: boolean;
    loadingMore: boolean;
    error: string | null;
    lastFetch: number | null;
    currentPage: number;
    hasMore: boolean;
    total: number;
}

export interface PaginatedCampaignsResponse {
    data: Campaign[];
    meta: {
        total: number;
        page: number;
        offset: number;
    };
}
