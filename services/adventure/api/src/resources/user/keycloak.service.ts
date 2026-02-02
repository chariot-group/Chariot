import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import KcAdminClient from '@keycloak/keycloak-admin-client';
import type UserRepresentation from '@keycloak/keycloak-admin-client/lib/defs/userRepresentation';

@Injectable()
export class KeycloakService {
    private readonly logger = new Logger(KeycloakService.name);
    private adminClient: KcAdminClient;

    constructor() {
        const keycloakUrl = process.env.KEYCLOAK_INTERNAL_URL || 'http://localhost:8080';

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

    async getUserById(keycloakId: string): Promise<UserRepresentation> {
        await this.authenticate();

        const realm = process.env.KEYCLOAK_REALM || 'chariot';

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
}
