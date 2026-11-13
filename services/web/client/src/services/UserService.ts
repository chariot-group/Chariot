import apiClient from '@/services/ApiService';
import { User, PasswordChangeDto, UpdateUserDto } from '@/types/user';

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
     * Change password for current authenticated user
     * @param passwordData Current and new passwords
     * @throws Error with message if password change fails
     * @see FR-user-password-change: User Password Change
     */
    async changePassword(passwordData: PasswordChangeDto): Promise<void> {
        try {
            await apiClient().put(`${this.BASE_PATH}/me/password`, passwordData);
        } catch (error: unknown) {
            const apiError = error as { response?: { data?: { detail?: string }; status?: number } };
            // Extract error message from API response (RFC 9457 format)
            if (apiError.response?.data?.detail) {
                throw new Error(apiError.response.data.detail);
            }
            if (apiError.response?.status === 401) {
                throw new Error('Current password is incorrect');
            }
            if (apiError.response?.status === 403) {
                throw new Error('New password does not meet complexity requirements');
            }
            console.error('Error changing password:', error);
            throw new Error('Failed to change password');
        }
    }

    /**
     * Met à jour les informations de l'utilisateur connecté
     */
    async updateCurrentUser(userData: UpdateUserDto): Promise<User> {
        try {
            const response = await apiClient().put<IResponse<User>>(`${this.BASE_PATH}/me`, userData);
            return response.data.data;
        } catch (error: unknown) {
            const apiError = error as { response?: { data?: { detail?: string } } };
            // Extract error message from API response (RFC 9457 format)
            if (apiError.response?.data?.detail) {
                throw new Error(apiError.response.data.detail);
            }
            console.error('Error updating current user:', error);
            throw new Error('Failed to update profile');
        }
    }

    async addHistory(campaignName: string, value: number): Promise<User> {
        try {
            const response = await apiClient().put<IResponse<User>>(`${this.BASE_PATH}/me/history`, {
                campaignName,
                value,
            });
            return response.data.data;
        } catch (error) {
            console.error('Error adding history:', error);
            throw new Error('Failed to add history entry');
        }
    }

    /**
     * Récupère le profil public (nom, avatar) d'un autre utilisateur.
     * `sessionCode` est requis sauf lorsque `id` est l'utilisateur courant : le serveur
     * vérifie que l'appelant et la cible sont tous deux participants de cette session.
     * @see FR-user-public-profile-read-access
     */
    async getUserById(
        id: string,
        sessionCode?: string | null,
    ): Promise<Pick<User, 'keycloakId' | 'firstName' | 'lastName' | 'username' | 'avatar'>> {
        try {
            const response = await apiClient().get<IResponse<User>>(`${this.BASE_PATH}/${id}`, {
                params: sessionCode ? { sessionCode } : undefined,
            });
            return response.data.data;
        } catch (error) {
            console.error(`Error fetching user ${id}:`, error);
            throw error;
        }
    }
}

const userService = new UserService();

export default userService;
