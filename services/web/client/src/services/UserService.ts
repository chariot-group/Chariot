import apiClient from '@/services/ApiService';
import { User, UpdateUserDto } from '@/types/user';

interface IResponse<T> {
    message: string;
    data: T;
}

class UserService {
    private readonly BASE_PATH = '/user';

    /**
     * Récupère les informations de l'utilisateur connecté
     */
    async getCurrentUser(): Promise<User> {
        try {
            const response = await apiClient().get<IResponse<User>>(`${this.BASE_PATH}/me`);
            return response.data.data;
        } catch (error) {
            console.error('Error fetching current user:', error);
            throw error;
        }
    }

    /**
     * Met à jour les informations de l'utilisateur connecté
     */
    async updateCurrentUser(userData: UpdateUserDto): Promise<User> {
        try {
            const response = await apiClient().put<IResponse<User>>(`${this.BASE_PATH}/me`, userData);
            return response.data.data;
        } catch (error) {
            console.error('Error updating current user:', error);
            throw error;
        }
    }
}

export default new UserService();
