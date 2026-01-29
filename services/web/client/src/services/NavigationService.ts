import CharacterService from './CharacterService';
import CampaignService from './CampaignService';
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
    reason: 'character-without-group' | 'character-in-campaign' | 'no-characters';
}

class NavigationService {
    /**
     * Charge les personnages sans groupe via Redux (optimisation: cache partagé avec Sidebar)
     */
    private async loadCharactersWithoutGroup(dispatch: AppDispatch, getState: () => RootState): Promise<void> {
        const state = getState();
        const isLoading = selectCharactersWithoutGroupLoading(state);
        const characters = selectCharactersWithoutGroup(state);

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
     */
    private async loadCampaigns(dispatch: AppDispatch, getState: () => RootState): Promise<void> {
        const state = getState();
        const isLoading = selectCampaignsLoading(state);
        const campaigns = selectCampaigns(state);

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
        getState: () => RootState
    ): Promise<NavigationDestination> {
        try {
            // Priorité 1: Charger et vérifier les personnages sans groupe via Redux
            await this.loadCharactersWithoutGroup(dispatch, getState);
            const state = getState();
            const charactersWithoutGroup = selectCharactersWithoutGroup(state);

            if (charactersWithoutGroup.length > 0) {
                const firstCharacter = charactersWithoutGroup[0];
                return {
                    path: `/${locale}/characters/${firstCharacter._id}`,
                    reason: 'character-without-group'
                };
            }

            // Priorité 2: Charger et vérifier les personnages dans les campagnes via Redux
            await this.loadCampaigns(dispatch, getState);
            const campaigns = selectCampaigns(getState());

            if (campaigns.length > 0) {
                // Parcourir les campagnes pour trouver le premier personnage
                for (const campaign of campaigns) {
                    // Vérifier les groupes actifs d'abord
                    if (campaign.groups?.active && campaign.groups.active.length > 0) {
                        // Récupérer les détails de la campagne pour obtenir les groupes populés
                        const campaignDetails = await CampaignService.getCampaignById(campaign._id);

                        if (campaignDetails.groups?.active && campaignDetails.groups.active.length > 0) {
                            const firstGroup: any = campaignDetails.groups.active[0];

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
     * Vérifie si le chemin actuel nécessite une redirection post-connexion
     * Évite de rediriger si l'utilisateur est déjà sur une page pertinente
     * 
     * @param currentPath - Le pathname actuel
     * @returns boolean - true si une redirection est nécessaire
     */
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

export default new NavigationService();
