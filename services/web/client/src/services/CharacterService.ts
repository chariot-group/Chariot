import apiClient from './ApiService';
import { Character } from '@/types/character';

interface CharacterResponse {
    message: string;
    data: Character;
}

class CharacterService {
    private readonly BASE_PATH = '/characters';

    /**
     * Récupère un personnage par son ID
     */
    async getCharacterById(characterId: string): Promise<Character> {
        try {
            const response = await apiClient().get<CharacterResponse>(`${this.BASE_PATH}/${characterId}`);
            return response.data.data;
        } catch (error) {
            console.error(`Error fetching character ${characterId}:`, error);
            throw error;
        }
    }

    /**
     * Met à jour un personnage
     */
    async updateCharacter(characterId: string, data: Partial<Character>): Promise<Character> {
        try {
            const response = await apiClient().patch<CharacterResponse>(`${this.BASE_PATH}/${characterId}`, data);
            return response.data.data;
        } catch (error) {
            console.error(`Error updating character ${characterId}:`, error);
            throw error;
        }
    }

    /**
     * Supprime un personnage
     */
    async deleteCharacter(characterId: string): Promise<void> {
        try {
            await apiClient().delete(`${this.BASE_PATH}/${characterId}`);
        } catch (error) {
            console.error(`Error deleting character ${characterId}:`, error);
            throw error;
        }
    }
}

export default new CharacterService();
