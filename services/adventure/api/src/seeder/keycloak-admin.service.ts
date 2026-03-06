import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import KcAdminClient from '@keycloak/keycloak-admin-client';

@Injectable()
export class KeycloakAdminService {
    private readonly logger = new Logger(KeycloakAdminService.name);
    private adminClient: KcAdminClient;

    constructor(private configService: ConfigService) {
        const keycloakUrl = this.configService.get<string>('KEYCLOAK_INTERNAL_URL', 'http://keycloak:8080/auth');

        this.adminClient = new KcAdminClient({
            baseUrl: keycloakUrl,
            realmName: 'master',
        });

        this.logger.log(`Keycloak Admin Client configured with baseUrl: ${keycloakUrl}`);
    }

    private async authenticate() {
        try {
            await this.adminClient.auth({
                username: this.configService.get<string>('KEYCLOAK_ADMIN_USER', 'admin'),
                password: this.configService.get<string>('KEYCLOAK_ADMIN_PASSWORD', 'admin'),
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
        avatarUrl?: string,
    ): Promise<string> {
        await this.authenticate();

        const realm = this.configService.get<string>('KEYCLOAK_REALM', 'chariot');

        try {
            const userResponse = await this.adminClient.users.create({
                realm,
                username,
                email,
                firstName: firstName || username,
                lastName: lastName || 'User',
                attributes: avatarUrl ? { avatar: [avatarUrl] } : {},
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

        const realm = this.configService.get<string>('KEYCLOAK_REALM', 'chariot');

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
