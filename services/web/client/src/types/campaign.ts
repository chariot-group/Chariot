export type GameSystem = 'DND_5E';

export interface Campaign {
    _id: string;
    label: string;
    gameSystem: GameSystem;
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
    /** Present on Player characters when groups API populates `progression`. @see FR-character-sheet-pdf-export */
    progression?: unknown;
    /** Present on NPC characters when groups API populates `challenge`. @see FR-character-sheet-pdf-export */
    challenge?: unknown;
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
    /** Campagne pour laquelle le cache ci-dessous est valide (null = vide ou incohérent) */
    groupsCampaignId: string | null;
    loading: boolean;
    loadingMoreActive: boolean;
    loadingMoreArchived: boolean;
    error: string | null;
    openGroupId: string[];
    lastFetch: number | null;
    activePage: number;
    activeHasMore: boolean;
    activeTotal: number;
    archivedPage: number;
    archivedHasMore: boolean;
    archivedTotal: number;
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
