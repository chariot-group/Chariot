import { Injectable, Logger } from '@nestjs/common';
import KcAdminClient from '@keycloak/keycloak-admin-client';

@Injectable()
export class KeycloakAdminService {
    private readonly logger = new Logger(KeycloakAdminService.name);
    private adminClient: KcAdminClient;

    constructor() {
        const keycloakUrl = process.env.KEYCLOAK_INTERNAL_URL
            || process.env.KEYCLOAK_URL
            || 'http://localhost:8080';

        this.adminClient = new KcAdminClient({
            baseUrl: keycloakUrl,
            realmName: 'master',
        });

        this.logger.log(`Keycloak Admin Client configured with baseUrl: ${keycloakUrl}`);
    }

    private async authenticate() {
        try {
            await this.adminClient.auth({
                username: process.env.KEYCLOAK_ADMIN_USER || 'admin',
                password: process.env.KEYCLOAK_ADMIN_PASSWORD || 'admin',
                grantType: 'password',
                clientId: 'admin-cli',
            });
            this.logger.log('Authenticated with Keycloak admin');
        } catch (error) {
            this.logger.error('Failed to authenticate with Keycloak', error);
            throw error;
        }
    }

    async createUser(
        username: string,
        email: string,
        password: string,
        firstName?: string,
        lastName?: string,
    ): Promise<string> {
        await this.authenticate();

        const realm = process.env.KEYCLOAK_REALM || 'chariot';

        try {
            const userResponse = await this.adminClient.users.create({
                realm,
                username,
                email,
                firstName: firstName || username,
                lastName: lastName || 'User',
                enabled: true,
                emailVerified: true,
                credentials: [
                    {
                        type: 'password',
                        value: password,
                        temporary: false,
                    },
                ],
                realmRoles: ['users'],
            });

            const userId = userResponse.id;
            this.logger.log(`User created in Keycloak: ${username} (${userId})`);

            return userId;
        } catch (error) {
            this.logger.error(`Failed to create user ${username}`, error);
            throw error;
        }
    }

    async deleteAllUsers(): Promise<void> {
        await this.authenticate();

        const realm = process.env.KEYCLOAK_REALM || 'chariot';

        try {
            const users = await this.adminClient.users.find({ realm });

            for (const user of users) {
                if (user.username !== 'admin') {
                    await this.adminClient.users.del({ realm, id: user.id });
                    this.logger.log(`Deleted user: ${user.username}`);
                }
            }

            this.logger.log('All users deleted from Keycloak');
        } catch (error) {
            this.logger.error('Failed to delete users', error);
            throw error;
        }
    }

}
