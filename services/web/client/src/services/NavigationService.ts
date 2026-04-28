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
import { useAppSelector } from '@/store/hooks';

interface NavigationDestination {
    path: string;
    reason: 'character-without-group' | 'character-in-campaign' | 'character-in-space' | 'no-characters';
    groupId?: string;
    characterId?: string;
}

type CampaignGroup = { _id: string; characters?: Array<{ _id: string }> };
type GroupRef = string | { _id?: string };

class NavigationService {
    /**
     * Charge les personnages sans groupe via Redux (optimisation: cache partagé avec Sidebar)
     */
    private async loadCharactersWithoutGroup(dispatch: AppDispatch): Promise<void> {
        const isLoading = useAppSelector(selectCharactersWithoutGroupLoading);
        const characters = useAppSelector(selectCharactersWithoutGroup);

        // Si déjà chargé ou en cours de chargement, ne rien faire
        if (isLoading || characters.length > 0) {
            return;
        }

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

    /**
     * Charge les campagnes via Redux (optimisation: cache partagé avec Sidebar)
     * Note: Les délais et le debouncing sont gérés par useCampaigns hook avec cooldown de 3s
     */
    private async loadCampaigns(dispatch: AppDispatch): Promise<void> {
        const isLoading = useAppSelector(selectCampaignsLoading);
        const campaigns = useAppSelector(selectCampaigns);

        // Si déjà chargé ou en cours de chargement, ne rien faire
        if (isLoading || campaigns.length > 0) {
            return;
        }

        dispatch(fetchCampaignsStart());
        try {
            const campaigns = await CampaignService.getCampaigns({ page: 1, offset: 10 });
            dispatch(fetchCampaignsSuccess({
                campaigns,
                total: campaigns.length
            }));
        } catch (error) {
            dispatch(fetchCampaignsFailure(
                error instanceof Error ? error.message : 'Failed to fetch campaigns'
            ));
        }
    }

    /**
     * Détermine la destination de navigation appropriée après connexion
     * 
     * Logique de priorisation (FR-006):
     * 1. Si au moins un personnage sans groupe existe → /characters/{id}
     * 2. Sinon, si au moins un personnage dans une campagne → /campaigns/{cId}/groups/{gId}/characters/{chId}
     * 3. Sinon → /welcome
     * 
     * OPTIMISATION: Utilise Redux pour partager les données avec la Sidebar
     * 
     * @param locale - La locale courante (fr, en, es)
     * @param dispatch - Redux dispatch function
     * @param getState - Redux getState function
     * @returns Promise<NavigationDestination> - Le chemin de destination et la raison
     */
    async determinePostLoginDestination(
        locale: string,
        dispatch: AppDispatch,
    ): Promise<NavigationDestination> {
        try {
            // Priorité 1: Charger et vérifier les personnages sans groupe via Redux
            await this.loadCharactersWithoutGroup(dispatch);
            const charactersWithoutGroup = useAppSelector(selectCharactersWithoutGroup);

            if (charactersWithoutGroup.length > 0) {
                const firstCharacter = charactersWithoutGroup[0];
                return {
                    path: `/${locale}/characters/${firstCharacter._id}`,
                    reason: 'character-without-group'
                };
            }

            // Priorité 2: Vérifier les personnages dans les campagnes
            const campaigns = useAppSelector(selectCampaigns);

            if (campaigns.length > 0) {
                // Parcourir les campagnes pour trouver le premier personnage
                for (const campaign of campaigns) {
                    // Vérifier les groupes actifs d'abord
                    if (campaign.groups?.active && campaign.groups.active.length > 0) {
                        // Récupérer les détails de la campagne pour obtenir les groupes populés
                        const campaignDetails = await CampaignService.getCampaignById(campaign._id);

                        if (campaignDetails.groups?.active && campaignDetails.groups.active.length > 0) {
                            const firstGroup = campaignDetails.groups.active[0] as unknown as CampaignGroup;

                            if (firstGroup.characters && firstGroup.characters.length > 0) {
                                const firstCharacter = firstGroup.characters[0];
                                return {
                                    path: `/${locale}/campaigns/${campaign._id}/groups/${firstGroup._id}/characters/${firstCharacter._id}`,
                                    reason: 'character-in-campaign'
                                };
                            }
                        }
                    }
                }
            }

            // Fallback: Aucun personnage trouvé
            return {
                path: `/${locale}/welcome`,
                reason: 'no-characters'
            };

        } catch (error) {
            console.error('Error determining post-login destination:', error);
            // En cas d'erreur, rediriger vers welcome par sécurité
            return {
                path: `/${locale}/welcome`,
                reason: 'no-characters'
            };
        }
    }

    /**
     * Détermine la destination de navigation quand on change d'espace (campagne) en mode MJ
     * Parcourt tous les groupes pour trouver le premier avec des personnages/NPCs
     * 
     * @param campaignId - L'ID de la campagne sélectionnée
     * @param locale - La locale courante (fr, en, es)
     * @returns Promise<NavigationDestination> - Le chemin de destination et la raison
     */
    async determineSpaceDestination(
        campaignId: string,
        locale: string
    ): Promise<NavigationDestination> {
        try {
            // Récupérer tous les groupes de la campagne
            const allGroups = await GroupService.getGroupsByCampaign(campaignId);

            // Récupérer les informations de la campagne pour connaître les groupes actifs/archivés
            const campaign = await CampaignService.getCampaignById(campaignId);

            if (!campaign.groups?.active || !campaign.groups?.archived) {
                return {
                    path: `/${locale}/welcome`,
                    reason: 'no-characters'
                };
            }

            // Normaliser les IDs (peuvent être des strings ou des IDs à extraire d'objets)
            const normalizeIds = (items: GroupRef[]): string[] =>
                items
                    .map((item) => (typeof item === 'string' ? item : item?._id))
                    .filter((id: string | undefined): id is string => Boolean(id));

            const activeGroupIds = normalizeIds(campaign.groups.active);
            const archivedGroupIds = normalizeIds(campaign.groups.archived);

            // Chercher le premier groupe actif avec des personnages
            const activeGroups = allGroups.filter(group => activeGroupIds.includes(group._id));
            for (const group of activeGroups) {
                if (group.characters && group.characters.length > 0) {
                    const firstCharacter = group.characters[0];
                    return {
                        path: `/${locale}/campaigns/${campaignId}/groups/${group._id}/characters/${firstCharacter._id}`,
                        reason: 'character-in-space',
                        groupId: group._id,
                        characterId: firstCharacter._id
                    };
                }
            }

            // Si pas de groupe actif avec personnages, chercher dans les groupes archivés
            const archivedGroups = allGroups.filter(group => archivedGroupIds.includes(group._id));
            for (const group of archivedGroups) {
                if (group.characters && group.characters.length > 0) {
                    const firstCharacter = group.characters[0];
                    return {
                        path: `/${locale}/campaigns/${campaignId}/groups/${group._id}/characters/${firstCharacter._id}`,
                        reason: 'character-in-space',
                        groupId: group._id,
                        characterId: firstCharacter._id
                    };
                }
            }

            // Fallback: aucun groupe avec personnages trouvé
            return {
                path: `/${locale}/welcome`,
                reason: 'no-characters'
            };

        } catch (error) {
            console.error('Error determining space destination:', error);
            // En cas d'erreur, rediriger vers welcome
            return {
                path: `/${locale}/welcome`,
                reason: 'no-characters'
            };
        }
    }

    /**
     * Détermine la destination de navigation quand on change d'espace (mode joueur)
     * Cherche le premier joueur sans groupe
     * 
     * @param locale - La locale courante (fr, en, es)
     * @param dispatch - Redux dispatch function
     * @param getState - Redux getState function
     * @returns Promise<NavigationDestination> - Le chemin de destination et la raison
     */
    async determinePlayerSpaceDestination(
        locale: string,
        dispatch: AppDispatch,
    ): Promise<NavigationDestination> {
        try {
            // Charger les personnages sans groupe
            await this.loadCharactersWithoutGroup(dispatch);
            const charactersWithoutGroup = useAppSelector(selectCharactersWithoutGroup);

            if (charactersWithoutGroup.length > 0) {
                const firstCharacter = charactersWithoutGroup[0];
                return {
                    path: `/${locale}/characters/${firstCharacter._id}`,
                    reason: 'character-without-group'
                };
            }

            // Fallback: aucun personnage trouvé
            return {
                path: `/${locale}/welcome`,
                reason: 'no-characters'
            };

        } catch (error) {
            console.error('Error determining player space destination:', error);
            // En cas d'erreur, rediriger vers welcome
            return {
                path: `/${locale}/welcome`,
                reason: 'no-characters'
            };
        }
    }


    shouldRedirectAfterLogin(currentPath: string): boolean {
        // Ne pas rediriger si déjà sur une page de personnage ou de campagne
        if (currentPath.includes('/characters/') ||
            currentPath.includes('/campaigns/') ||
            currentPath.includes('/welcome')) {
            return false;
        }

        // Rediriger depuis la racine ou les pages d'auth
        return currentPath === '/' ||
            !!currentPath.match(/^\/[a-z]{2}$/) || // ex: /fr
            currentPath.includes('/auth/');
    }
}

const navigationService = new NavigationService();

export default navigationService;
