import axios from 'axios'

const REALM = import.meta.env.VITE_KEYCLOAK_REALM || 'chariot'
const CLIENT_ID = import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'chariot-app'

// Utiliser des URLs relatives qui passeront par le proxy Vite
// API publique
const api = axios.create({
    baseURL: `/realms/${REALM}`,
    headers: {
        'Content-Type': 'application/json'
    }
})

// API admin
const adminApi = axios.create({
    baseURL: `/admin/realms/${REALM}`,
    headers: {
        'Content-Type': 'application/json'
    }
})

export const keycloakService = {
    async login(email, password) {
        try {
            const response = await api.post('/protocol/openid-connect/token',
                new URLSearchParams({
                    grant_type: 'password',
                    client_id: CLIENT_ID,
                    username: email,
                    password: password
                }),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            )
            return response.data
        } catch (error) {
            console.error('Login error:', error)
            throw error.response?.data || error
        }
    },

    async signup(userData) {
        try {
            // Obtenir un token admin
            const adminToken = await this.getAdminToken()

            // Créer l'utilisateur via l'API admin
            const createUserResponse = await adminApi.post('/users', {
                username: userData.email,
                email: userData.email,
                firstName: userData.firstName,
                lastName: userData.lastName,
                enabled: true,
                emailVerified: false,
                requiredActions: ['VERIFY_EMAIL'],
                attributes: {
                    username: [userData.username]
                }
            }, {
                headers: {
                    'Authorization': `Bearer ${adminToken}`,
                    'Content-Type': 'application/json'
                }
            })

            // Récupérer l'ID de l'utilisateur créé depuis le header Location
            const locationHeader = createUserResponse.headers.location || createUserResponse.headers.Location
            if (!locationHeader) {
                // Si pas de header Location, chercher l'utilisateur par email
                const usersResponse = await adminApi.get(`/users?email=${userData.email}&exact=true`, {
                    headers: {
                        'Authorization': `Bearer ${adminToken}`
                    }
                })

                if (usersResponse.data.length === 0) {
                    throw new Error('User creation failed')
                }

                var userId = usersResponse.data[0].id
            } else {
                var userId = locationHeader.split('/').pop()
            }

            // Définir le mot de passe
            await adminApi.put(`/users/${userId}/reset-password`, {
                type: 'password',
                value: userData.password,
                temporary: false
            }, {
                headers: {
                    'Authorization': `Bearer ${adminToken}`,
                    'Content-Type': 'application/json'
                }
            })

            // Assigner le rôle "users"
            const rolesResponse = await adminApi.get('/roles', {
                headers: {
                    'Authorization': `Bearer ${adminToken}`
                }
            })

            const userRole = rolesResponse.data.find(role => role.name === 'users')

            if (userRole) {
                await adminApi.post(`/users/${userId}/role-mappings/realm`, [
                    {
                        id: userRole.id,
                        name: userRole.name
                    }
                ], {
                    headers: {
                        'Authorization': `Bearer ${adminToken}`,
                        'Content-Type': 'application/json'
                    }
                })
            }

            // Envoyer l'email de vérification
            await adminApi.put(`/users/${userId}/execute-actions-email`,
                ['VERIFY_EMAIL'],
                {
                    headers: {
                        'Authorization': `Bearer ${adminToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            )

            return { success: true, userId }
        } catch (error) {
            console.error('Signup error:', error.response?.data || error)
            throw error.response?.data || error
        }
    },

    async resetPassword(email) {
        try {
            // Obtenir un token admin
            const adminToken = await this.getAdminToken()

            // Trouver l'utilisateur par email
            const usersResponse = await adminApi.get(`/users?email=${email}&exact=true`, {
                headers: {
                    'Authorization': `Bearer ${adminToken}`
                }
            })

            if (usersResponse.data.length === 0) {
                throw new Error('User not found')
            }

            const userId = usersResponse.data[0].id

            // Envoyer l'email de réinitialisation
            await adminApi.put(`/users/${userId}/execute-actions-email`,
                ['UPDATE_PASSWORD'],
                {
                    headers: {
                        'Authorization': `Bearer ${adminToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            )

            return { success: true }
        } catch (error) {
            console.error('Reset password error:', error)
            throw error.response?.data || error
        }
    },

    async getAdminToken() {
        try {
            const response = await api.post('/protocol/openid-connect/token',
                new URLSearchParams({
                    grant_type: 'password',
                    client_id: CLIENT_ID,
                    username: import.meta.env.VITE_KEYCLOAK_ADMIN_EMAIL,
                    password: import.meta.env.VITE_KEYCLOAK_ADMIN_PASSWORD
                }),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            )
            return response.data.access_token
        } catch (error) {
            console.error('Get admin token error:', error)
            throw error.response?.data || error
        }
    }
}
