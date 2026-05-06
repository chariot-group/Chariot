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
    firstname: string;
    lastname: string;
    surname: string;
    characterId?: string;
    userId: string;
}

export interface Character {
    _id: string;
    firstname: string;
    lastname: string;
    surname: string;
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
    openGroupId: string[];
    lastFetch: number | null;
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

/** Réponse brute attendue pour GET /campaigns (service adventure → gateway). */
export interface PaginatedCampaignsResponse {
    data: Campaign[];
    pagination?: {
        totalItems: number;
        page: number;
        offset: number;
    };
    message?: string;
}
