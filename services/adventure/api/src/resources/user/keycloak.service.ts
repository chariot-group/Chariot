import {
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import KcAdminClient from '@keycloak/keycloak-admin-client';
import type UserRepresentation from '@keycloak/keycloak-admin-client/lib/defs/userRepresentation';
import type CredentialRepresentation from '@keycloak/keycloak-admin-client/lib/defs/credentialRepresentation';

@Injectable()
export class KeycloakService {
  private readonly logger = new Logger(KeycloakService.name);
  private readonly realm: string = 'chariot';
  private adminClient: KcAdminClient;

  constructor(private configService: ConfigService) {
    const keycloakUrl = this.configService.get<string>(
      'KEYCLOAK_INTERNAL_URL',
      'http://keycloak:8080/auth',
    );

    this.adminClient = new KcAdminClient({
      baseUrl: keycloakUrl,
      realmName: 'master',
    });

    this.logger.log(
      `Keycloak Admin Client configured with baseUrl: ${keycloakUrl}`,
    );
  }

  private async authenticate() {
    try {
      await this.adminClient.auth({
        username: this.configService.get<string>(
          'KEYCLOAK_ADMIN_USER',
          'admin',
        ),
        password: this.configService.get<string>(
          'KEYCLOAK_ADMIN_PASSWORD',
          'admin',
        ),
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

      this.logger.log(
        `User information retrieved from Keycloak for: ${user.username} (avatar: ${user.attributes?.avatar?.[0] ? 'present' : 'missing'})`,
      );
      return user;
    } catch (error) {
      this.logger.error(
        `Failed to fetch user ${keycloakId} from Keycloak`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Verify user credentials and change password
   * @param keycloakId Keycloak user ID
   * @param username Username for authentication verification
   * @param currentPassword Current password to verify
   * @param newPassword New password to set
   * @throws UnauthorizedException if current password is incorrect
   * @throws ForbiddenException if new password doesn't meet policy
   * @see FR-user-password-change: User Password Change
   */
  async changeUserPassword(
    keycloakId: string,
    username: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const realm = this.configService.get<string>('KEYCLOAK_REALM', 'chariot');

    try {
      // Step 1: Verify current password by attempting authentication
      this.logger.debug(`Verifying current password for user: ${username}`);

      const testClient = new KcAdminClient({
        baseUrl: this.configService.get<string>(
          'KEYCLOAK_INTERNAL_URL',
          'http://keycloak:8080/auth',
        ),
        realmName: realm,
      });

      try {
        await testClient.auth({
          username,
          password: currentPassword,
          grantType: 'password',
          clientId: this.configService.get<string>(
            'KEYCLOAK_CLIENT_ID',
            'chariot-adventure',
          ),
        });
        this.logger.debug(`Current password verified for user: ${username}`);
      } catch {
        this.logger.warn(
          `Current password verification failed for user: ${username}`,
        );
        throw new UnauthorizedException('Current password is incorrect');
      }

      // Step 2: Authenticate admin client for password change
      await this.authenticate();

      // Step 3: Reset password with new value
      this.logger.debug(`Changing password for user: ${keycloakId}`);

      const credential: CredentialRepresentation = {
        type: 'password',
        value: newPassword,
        temporary: false,
      };

      await this.adminClient.users.resetPassword({
        realm,
        id: keycloakId,
        credential,
      });

      this.logger.log(`Password changed successfully for user: ${username}`);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      // Check for password policy violations
      if (error.response?.status === 400 || error.message?.includes('policy')) {
        this.logger.warn(`Password policy violation for user: ${username}`);
        throw new ForbiddenException(
          'New password does not meet complexity requirements',
        );
      }

      this.logger.error(
        `Failed to change password for user ${keycloakId}`,
        error.stack,
      );
      throw error;
    }
  }

  async updateUserAttributes(
    keycloakId: string,
    attributes: Record<string, string[]>,
  ): Promise<void> {
    await this.authenticate();

    const realm = this.configService.get<string>('KEYCLOAK_REALM', this.realm);

    const existing = await this.adminClient.users.findOne({
      realm,
      id: keycloakId,
    });

    if (!existing) {
      throw new NotFoundException(`User not found: ${keycloakId}`);
    }

    await this.adminClient.users.update(
      { realm, id: keycloakId },
      {
        attributes: {
          ...(existing.attributes ?? {}),
          ...attributes,
        },
      },
    );
  }

  async updateUser(
    keycloakId: string,
    userData: { firstName?: string; lastName?: string; email?: string },
  ): Promise<void> {
    await this.authenticate();

    const realm = this.configService.get<string>('KEYCLOAK_REALM', this.realm);

    try {
      this.logger.debug(
        `Updating user in Keycloak: ${keycloakId}`,
        KeycloakService.name,
      );

      await this.adminClient.users.update(
        {
          realm,
          id: keycloakId,
        },
        userData,
      );

      this.logger.log(
        `User ${keycloakId} updated successfully in Keycloak`,
        KeycloakService.name,
      );
    } catch (error) {
      // Check for email already exists error (Keycloak returns 409 Conflict)
      if (
        error.response?.status === 409 ||
        (error.message &&
          error.message.toLowerCase().includes('email') &&
          (error.message.toLowerCase().includes('exists') ||
            error.message.toLowerCase().includes('already') ||
            error.message.toLowerCase().includes('duplicate')))
      ) {
        this.logger.warn(
          `Email already exists for user ${keycloakId}`,
          KeycloakService.name,
        );
        throw new BadRequestException(
          'This email address is already in use by another account',
        );
      }

      this.logger.error(
        `Failed to update user ${keycloakId} in Keycloak`,
        error.stack,
        KeycloakService.name,
      );
      throw error;
    }
  }
}
