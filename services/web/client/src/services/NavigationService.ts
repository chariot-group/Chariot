import CharacterService from '@/services/CharacterService';
import CampaignService from '@/services/CampaignService';
import GroupService from '@/services/GroupService';
import { AppDispatch, RootState } from '@/store';
import {
    fetchCharactersWithoutGroupStart,
    fetchCharactersWithoutGroupSuccess,
    fetchCharactersWithoutGroupFailure,
    selectCharactersWithoutGroup,
    selectCharactersWithoutGroupLoading
} from '@/store/slices/characterSlice';
import {
    fetchCampaignsStart,
    fetchCampaignsSuccess,
    fetchCampaignsFailure,
    selectCampaigns,
    selectCampaignsLoading
} from '@/store/slices/campaignSlice';

interface NavigationDestination {
    path: string;
    reason: 'character-without-group' | 'character-in-campaign' | 'character-in-space' | 'no-characters';
    groupId?: string;
    characterId?: string;
}

type CampaignGroup = { _id: string; characters?: Array<{ _id: string }> };
type GroupRef = string | { _id?: string };

class NavigationService {
    private async loadCharactersWithoutGroup(
        dispatch: AppDispatch,
        getState: () => RootState
    ): Promise<void> {
        const state = getState();
        const isLoading = selectCharactersWithoutGroupLoading(state);
        const characters = selectCharactersWithoutGroup(state);

        if (isLoading || characters.length > 0) return;

        dispatch(fetchCharactersWithoutGroupStart());
        try {
            const response = await CharacterService.getPlayersWithoutGroup(1, 10);
            dispatch(fetchCharactersWithoutGroupSuccess({
                characters: response.data,
                total: response.pagination.totalItems
            }));
        } catch (error) {
            dispatch(fetchCharactersWithoutGroupFailure(
                error instanceof Error ? error.message : 'Failed to fetch characters'
            ));
        }
    }

    private async loadCampaigns(
        dispatch: AppDispatch,
        getState: () => RootState
    ): Promise<void> {
        const state = getState();
        const isLoading = selectCampaignsLoading(state);
        const campaigns = selectCampaigns(state);

        if (isLoading || campaigns.length > 0) return;

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
            await this.loadCharactersWithoutGroup(dispatch, getState);
            const charactersWithoutGroup = selectCharactersWithoutGroup(getState());

            if (charactersWithoutGroup.length > 0) {
                return {
                    path: `/${locale}/characters/${charactersWithoutGroup[0]._id}`,
                    reason: 'character-without-group'
                };
            }

            await this.loadCampaigns(dispatch, getState);
            const campaigns = selectCampaigns(getState());

            if (campaigns.length > 0) {
                for (const campaign of campaigns) {
                    if (campaign.groups?.active && campaign.groups.active.length > 0) {
                        const campaignDetails = await CampaignService.getCampaignById(campaign._id);

                        if (campaignDetails.groups?.active && campaignDetails.groups.active.length > 0) {
                            const firstGroup = campaignDetails.groups.active[0] as unknown as CampaignGroup;

                            if (firstGroup.characters && firstGroup.characters.length > 0) {
                                return {
                                    path: `/${locale}/campaigns/${campaign._id}/groups/${firstGroup._id}/characters/${firstGroup.characters[0]._id}`,
                                    reason: 'character-in-campaign'
                                };
                            }
                        }
                    }
                }
            }

            return { path: `/${locale}/welcome`, reason: 'no-characters' };

        } catch (error) {
            console.error('Error determining post-login destination:', error);
            return { path: `/${locale}/welcome`, reason: 'no-characters' };
        }
    }

    async determineSpaceDestination(
        campaignId: string,
        locale: string
    ): Promise<NavigationDestination> {
        try {
            const allGroups = await GroupService.getGroupsByCampaign(campaignId);
            const campaign = await CampaignService.getCampaignById(campaignId);

            if (!campaign.groups?.active || !campaign.groups?.archived) {
                return { path: `/${locale}/welcome`, reason: 'no-characters' };
            }

            const normalizeIds = (items: GroupRef[]): string[] =>
                items
                    .map((item) => (typeof item === 'string' ? item : item?._id))
                    .filter((id: string | undefined): id is string => Boolean(id));

            const activeGroupIds = normalizeIds(campaign.groups.active);
            const archivedGroupIds = normalizeIds(campaign.groups.archived);

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

            return { path: `/${locale}/welcome`, reason: 'no-characters' };

        } catch (error) {
            console.error('Error determining space destination:', error);
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

            return { path: `/${locale}/welcome`, reason: 'no-characters' };

        } catch (error) {
            console.error('Error determining player space destination:', error);
            return { path: `/${locale}/welcome`, reason: 'no-characters' };
        }
    }

    shouldRedirectAfterLogin(currentPath: string): boolean {
        if (currentPath.includes('/characters/') ||
            currentPath.includes('/campaigns/') ||
            currentPath.includes('/welcome')) {
            return false;
        }
        return currentPath === '/' ||
            !!currentPath.match(/^\/[a-z]{2}$/) ||
            currentPath.includes('/auth/');
    }
}

const navigationService = new NavigationService();
export default navigationService;