import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import KeycloakBearerStrategy from 'passport-keycloak-bearer';

type KeycloakPayload = {
  sub?: string;
  email?: string;
  preferred_username?: string;
  realm_access?: {
    roles?: string[];
  };
};

@Injectable()
export class KeycloakStrategy extends PassportStrategy(
  KeycloakBearerStrategy,
  'keycloak',
) {
  constructor(private configService: ConfigService) {
    super({
      realm: configService.get<string>('KEYCLOAK_REALM', 'chariot'),
      url: configService.get<string>('KEYCLOAK_INTERNAL_URL'),
    });
  }
  async validate(payload: KeycloakPayload) {
    if (!payload || !payload.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }

    return {
      keycloakId: payload.sub,
      email: payload.email,
      username: payload.preferred_username,
      roles: payload.realm_access?.roles || [],
    };
  }
}
