import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface KeycloakUserInfo {
    id: string;
    firstName?: string;
    lastName?: string;
    username?: string;
    email?: string;
}

@Injectable()
export class KeycloakAdminService implements OnModuleInit {
    private readonly logger = new Logger(KeycloakAdminService.name);
    private readonly SERVICE_NAME = KeycloakAdminService.name;

    private keycloakInternalUrl: string;
    private realm: string;
    private adminUser: string;
    private adminPassword: string;

    private adminToken: string | null = null;
    private tokenExpiresAt = 0;

    constructor(private readonly configService: ConfigService) { }

    onModuleInit() {
        this.keycloakInternalUrl = this.configService.get<string>('KEYCLOAK_INTERNAL_URL');
        this.realm = this.configService.get<string>('KEYCLOAK_REALM');
        this.adminUser = this.configService.get<string>('KEYCLOAK_ADMIN_USER');
        this.adminPassword = this.configService.get<string>('KEYCLOAK_ADMIN_PASSWORD');
    }

    private async getAdminToken(): Promise<string> {
        if (this.adminToken && Date.now() < this.tokenExpiresAt) {
            return this.adminToken;
        }

        const url = `${this.keycloakInternalUrl}/realms/master/protocol/openid-connect/token`;
        const params = new URLSearchParams({
            grant_type: 'password',
            client_id: 'admin-cli',
            username: this.adminUser,
            password: this.adminPassword,
        });

        const res = await axios.post(url, params.toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            timeout: 5000,
        });

        this.adminToken = res.data.access_token as string;
        // Refresh 30 s before expiry
        this.tokenExpiresAt = Date.now() + (res.data.expires_in - 30) * 1000;
        return this.adminToken;
    }

    async getUserById(userId: string): Promise<KeycloakUserInfo | null> {
        try {
            const token = await this.getAdminToken();
            const url = `${this.keycloakInternalUrl}/admin/realms/${this.realm}/users/${userId}`;
            const res = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 5000,
            });
            return {
                id: res.data.id,
                firstName: res.data.firstName,
                lastName: res.data.lastName,
                username: res.data.username,
                email: res.data.email,
            };
        } catch (error) {
            this.logger.warn(
                `Failed to fetch Keycloak user ${userId}: ${error instanceof Error ? error.message : String(error)}`,
                this.SERVICE_NAME,
            );
            return null;
        }
    }

    async getUsersByIds(userIds: string[]): Promise<Map<string, KeycloakUserInfo>> {
        const unique = [...new Set(userIds)];
        const results = await Promise.allSettled(
            unique.map((id) => this.getUserById(id)),
        );

        const map = new Map<string, KeycloakUserInfo>();
        unique.forEach((id, idx) => {
            const result = results[idx];
            if (result.status === 'fulfilled' && result.value) {
                map.set(id, result.value);
            }
        });
        return map;
    }
}
