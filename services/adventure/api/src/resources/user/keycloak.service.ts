import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import KcAdminClient from '@keycloak/keycloak-admin-client';
import type UserRepresentation from '@keycloak/keycloak-admin-client/lib/defs/userRepresentation';

@Injectable()
export class KeycloakService {
    private readonly logger = new Logger(KeycloakService.name);
    private readonly realm: string = 'chariot';
    private adminClient: KcAdminClient;

    constructor(private configService: ConfigService) {
        const keycloakUrl = this.configService.get<string>('KEYCLOAK_INTERNAL_URL', 'http://localhost:8080');

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

    async getUserById(keycloakId: string): Promise<UserRepresentation> {
        await this.authenticate();

        const realm = this.configService.get<string>('KEYCLOAK_REALM', this.realm);

        try {
            this.logger.debug(`Fetching user from Keycloak: ${keycloakId}`);

            const user = await this.adminClient.users.findOne({
                realm,
                id: keycloakId,
                userProfileMetadata: true,
            });

            if (!user) {
                this.logger.warn(`User not found in Keycloak: ${keycloakId}`);
                throw new NotFoundException(`User not found: ${keycloakId}`);
            }

            this.logger.log(`User information retrieved from Keycloak for: ${user.username} (avatar: ${user.attributes?.avatar?.[0] ? 'present' : 'missing'})`);
            return user;
        } catch (error) {
            this.logger.error(`Failed to fetch user ${keycloakId} from Keycloak`, error.stack);
            throw error;
        }
    }

    async updateUser(keycloakId: string, userData: { firstName?: string; lastName?: string; email?: string }): Promise<void> {
        await this.authenticate();

        const realm = this.configService.get<string>('KEYCLOAK_REALM', this.realm);

        try {
            this.logger.debug(`Updating user in Keycloak: ${keycloakId}`, KeycloakService.name);

            await this.adminClient.users.update(
                {
                    realm,
                    id: keycloakId,
                },
                userData,
            );

            this.logger.log(`User ${keycloakId} updated successfully in Keycloak`, KeycloakService.name);
        } catch (error) {
            this.logger.error(`Failed to update user ${keycloakId} in Keycloak`, error.stack, KeycloakService.name);
            throw error;
        }
    }
}
