import CharacterService from '@/services/CharacterService';
import CampaignService from '@/services/CampaignService';
import GroupService from '@/services/GroupService';
import { shouldRedirectAfterLogin as shouldRedirectAfterLoginPath } from '@/lib/postLoginNavigation';
import { AppDispatch, RootState } from '@/store';
import {
    fetchCharactersWithoutGroupStart,
    fetchCharactersWithoutGroupSuccess,
    fetchCharactersWithoutGroupFailure,
    selectCharactersWithoutGroup,
    selectCharactersWithoutGroupLoading,
    clearCharacters,
    setLinkedNpcs,
    setUnlinkedNpcsWithoutGroup,
} from '@/store/slices/characterSlice';
import type { NPC } from '@/types/character';
import { isCharacterAccessDeniedError } from '@/lib/characterAccessError';
import { reportClientIssue } from "@/logger/reportClientIssue";
import {
    fetchCampaignsStart,
    fetchCampaignsSuccess,
    fetchCampaignsFailure,
    selectCampaigns,
    selectCampaignsLoading
} from '@/store/slices/campaignSlice';

interface NavigationDestination {
    path: string;
    reason:
        | 'character-without-group'
        | 'character-in-campaign'
        | 'character-in-space'
        | 'no-characters'
        | 'no-characters-player-space'
        | 'no-characters-campaign';
    groupId?: string;
    characterId?: string;
}

type CampaignGroup = { _id: string; characters?: Array<{ _id: string }> };
type GroupRef = string | { _id?: string };

class NavigationService {
    private async loadPlayerSpaceNpcs(dispatch: AppDispatch, players: Array<{ _id?: string }>): Promise<void> {
        const playerIds = players.map((player) => player._id).filter((id): id is string => Boolean(id));
        try {
            const [unlinkedResponse, linked] = await Promise.all([
                CharacterService.getUnlinkedNpcsWithoutGroup(1, 50),
                CharacterService.getNpcsByLinkedPlayers(playerIds),
            ]);
            dispatch(setUnlinkedNpcsWithoutGroup((unlinkedResponse.data ?? []) as NPC[]));
            dispatch(setLinkedNpcs(linked));
        } catch {
            dispatch(setLinkedNpcs([]));
            dispatch(setUnlinkedNpcsWithoutGroup([]));
        }
    }

    private async loadCharactersWithoutGroup(
        dispatch: AppDispatch,
        getState: () => RootState,
        options?: { forceRefresh?: boolean },
    ): Promise<void> {
        const state = getState();
        const isLoading = selectCharactersWithoutGroupLoading(state);
        const characters = selectCharactersWithoutGroup(state);

        if (options?.forceRefresh) {
            // Always refetch after account switch — ignore in-flight/cached list (FR-user-cache-isolation).
            dispatch(clearCharacters());
            dispatch(fetchCharactersWithoutGroupStart());
            try {
                const response = await CharacterService.getPlayersWithoutGroup(1, 10);
                dispatch(fetchCharactersWithoutGroupSuccess({
                    characters: response.data,
                    total: response.pagination.totalItems
                }));
                // Sidebar data, not needed to choose a destination: do not delay navigation
                // (FR-web-first-load-performance, slow-network round trip).
                void this.loadPlayerSpaceNpcs(dispatch, response.data);
            } catch (error) {
                dispatch(fetchCharactersWithoutGroupFailure(
                    error instanceof Error ? error.message : 'Failed to fetch characters'
                ));
            }
            return;
        }

        if (isLoading || characters.length > 0) return;

        dispatch(fetchCharactersWithoutGroupStart());
        try {
            const response = await CharacterService.getPlayersWithoutGroup(1, 10);
            dispatch(fetchCharactersWithoutGroupSuccess({
                characters: response.data,
                total: response.pagination.totalItems
            }));
            // Sidebar data, not needed to choose a destination: do not delay navigation
            // (FR-web-first-load-performance, slow-network round trip).
            void this.loadPlayerSpaceNpcs(dispatch, response.data);
        } catch (error) {
            dispatch(fetchCharactersWithoutGroupFailure(
                error instanceof Error ? error.message : 'Failed to fetch characters'
            ));
        }
    }

    private async loadCampaigns(
        dispatch: AppDispatch,
        getState: () => RootState,
        options?: { forceRefresh?: boolean },
    ): Promise<void> {
        const state = getState();
        const isLoading = selectCampaignsLoading(state);
        const campaigns = selectCampaigns(state);

        // A forced refresh always fetches: another loader (sidebar) may be in flight with other paging,
        // and post-login resolution must not read an empty list meanwhile.
        if (!options?.forceRefresh && (isLoading || campaigns.length > 0)) return;

        dispatch(fetchCampaignsStart());
        try {
            const result = await CampaignService.getCampaigns({ page: 1, offset: 10 });
            dispatch(fetchCampaignsSuccess({
                campaigns: result.data,
                total: result.totalItems,
                pageSize: 10,
            }));
        } catch (error) {
            dispatch(fetchCampaignsFailure(
                error instanceof Error ? error.message : 'Failed to fetch campaigns'
            ));
        }
    }

    async determinePostLoginDestination(
        locale: string,
        dispatch: AppDispatch,
        getState: () => RootState,
    ): Promise<NavigationDestination> {
        try {
            // Both lists leave together to save round trips on slow networks; the priority below is
            // unchanged (FR-post-auth-navigation). loadCampaigns never rejects (failure → store).
            const campaignsLoaded = this.loadCampaigns(dispatch, getState, { forceRefresh: true });
            await this.loadCharactersWithoutGroup(dispatch, getState, { forceRefresh: true });
            const charactersWithoutGroup = selectCharactersWithoutGroup(getState());

            for (const candidate of charactersWithoutGroup) {
                if (!candidate?._id) continue;
                try {
                    await CharacterService.getCharacterById(candidate._id);
                    return {
                        path: `/${locale}/characters/${candidate._id}`,
                        reason: 'character-without-group',
                        characterId: candidate._id,
                    };
                } catch (error) {
                    // Stale/foreign sheet after account switch — try next, else campaigns/welcome.
                    if (!isCharacterAccessDeniedError(error)) {
                        throw error;
                    }
                }
            }

            await campaignsLoaded;
            const campaigns = selectCampaigns(getState());

            if (campaigns.length > 0) {
                // Details are requested in parallel but read in list order (same priority).
                const detailsById = new Map(
                    campaigns
                        .filter((campaign) => campaign.groups?.active && campaign.groups.active.length > 0)
                        .map((campaign) => {
                            const details = CampaignService.getCampaignById(campaign._id);
                            // Unread results after an early return must not surface as unhandled rejections.
                            details.catch(() => undefined);
                            return [campaign._id, details] as const;
                        }),
                );
                for (const campaign of campaigns) {
                    const pendingDetails = detailsById.get(campaign._id);
                    if (pendingDetails) {
                        const campaignDetails = await pendingDetails;

                        // Inspect every active group: an empty first group must not fall back to welcome (FR-session-end-navigation).
                        const activeGroups = (campaignDetails.groups?.active ?? []) as unknown as CampaignGroup[];
                        for (const group of activeGroups) {
                            if (group?.characters && group.characters.length > 0) {
                                return {
                                    path: `/${locale}/campaigns/${campaign._id}/groups/${group._id}/characters/${group.characters[0]._id}`,
                                    reason: 'character-in-campaign'
                                };
                            }
                        }
                    }
                }
            }

            // FR-welcome-onboarding-fallbacks: a user with a campaign never lands on welcome.
            if (campaigns.length > 0) {
                return { path: `/${locale}/campaigns/${campaigns[0]._id}`, reason: 'no-characters-campaign' };
            }

            return { path: `/${locale}/welcome`, reason: 'no-characters' };

        } catch (error) {
            reportClientIssue("error", "Error determining post-login destination", "Navigation", error);
            return { path: `/${locale}/welcome`, reason: 'no-characters' };
        }
    }

    async determineSpaceDestination(
        campaignId: string,
        locale: string
    ): Promise<NavigationDestination> {
        try {
            const allGroups = await GroupService.getAllGroupsByCampaign(campaignId);
            const campaign = await CampaignService.getCampaignById(campaignId);

            const normalizeIds = (items: GroupRef[]): string[] =>
                items
                    .map((item) => (typeof item === 'string' ? item : item?._id))
                    .filter((id: string | undefined): id is string => Boolean(id));

            const activeGroupIds = normalizeIds(campaign.groups?.active ?? []);
            // Missing archived list means no archived groups, not "no characters" (FR-session-end-navigation).
            const archivedGroupIds = normalizeIds(campaign.groups?.archived ?? []);

            const activeGroups = allGroups.filter(group => activeGroupIds.includes(group._id));
            for (const group of activeGroups) {
                if (group.characters && group.characters.length > 0) {
                    return {
                        path: `/${locale}/campaigns/${campaignId}/groups/${group._id}/characters/${group.characters[0]._id}`,
                        reason: 'character-in-space',
                        groupId: group._id,
                        characterId: group.characters[0]._id
                    };
                }
            }

            const archivedGroups = allGroups.filter(group => archivedGroupIds.includes(group._id));
            for (const group of archivedGroups) {
                if (group.characters && group.characters.length > 0) {
                    return {
                        path: `/${locale}/campaigns/${campaignId}/groups/${group._id}/characters/${group.characters[0]._id}`,
                        reason: 'character-in-space',
                        groupId: group._id,
                        characterId: group.characters[0]._id
                    };
                }
            }

            return { path: `/${locale}/campaigns/${campaignId}`, reason: 'no-characters-campaign' };

        } catch (error) {
            reportClientIssue("error", "Error determining space destination", "Navigation", error);
            return { path: `/${locale}/welcome`, reason: 'no-characters' };
        }
    }

    async determinePlayerSpaceDestination(
        locale: string,
        dispatch: AppDispatch,
        getState: () => RootState,
    ): Promise<NavigationDestination> {
        try {
            await this.loadCharactersWithoutGroup(dispatch, getState);
            const charactersWithoutGroup = selectCharactersWithoutGroup(getState());

            if (charactersWithoutGroup.length > 0) {
                return {
                    path: `/${locale}/characters/${charactersWithoutGroup[0]._id}`,
                    reason: 'character-without-group'
                };
            }

            return { path: `/${locale}/characters`, reason: 'no-characters-player-space' };

        } catch (error) {
            reportClientIssue("error", "Error determining player space destination", "Navigation", error);
            return { path: `/${locale}/welcome`, reason: 'no-characters' };
        }
    }

    /**
     * Logo click (FR-welcome-onboarding-fallbacks): the current space has priority, then the other one;
     * welcome only when the user has no campaign and no Player-space character.
     */
    async determineLogoDestination(
        locale: string,
        dispatch: AppDispatch,
        getState: () => RootState,
        context: { contextMode: 'player' | 'gm' | string | null; campaignId: string | null },
    ): Promise<NavigationDestination> {
        const isCharacterDestination = (destination: NavigationDestination) => destination.reason.startsWith('character');
        try {
            const prioritized =
                context.contextMode === 'gm' && context.campaignId
                    ? await this.determineSpaceDestination(context.campaignId, locale)
                    : context.contextMode === 'player'
                      ? await this.determinePlayerSpaceDestination(locale, dispatch, getState)
                      : null;
            if (prioritized && isCharacterDestination(prioritized)) return prioritized;

            const fallback = await this.determinePostLoginDestination(locale, dispatch, getState);
            if (isCharacterDestination(fallback)) return fallback;
            // No campaign and no character anywhere: welcome. Otherwise the current space's fallback keeps priority.
            if (fallback.reason === 'no-characters') return fallback;
            if (
                prioritized &&
                (prioritized.reason === 'no-characters-campaign' || prioritized.reason === 'no-characters-player-space')
            ) {
                return prioritized;
            }
            return fallback;
        } catch (error) {
            reportClientIssue("error", "Error determining logo destination", "Navigation", error);
        }
        return { path: `/${locale}/welcome`, reason: 'no-characters' };
    }

    shouldRedirectAfterLogin(currentPath: string): boolean {
        return shouldRedirectAfterLoginPath(currentPath);
    }
}

const navigationService = new NavigationService();
export default navigationService;
