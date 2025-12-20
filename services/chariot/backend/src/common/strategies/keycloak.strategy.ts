import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import * as KeycloakBearerStrategy from 'passport-keycloak-bearer';

@Injectable()
export class KeycloakStrategy extends PassportStrategy(
    KeycloakBearerStrategy,
    'keycloak',
) {
    constructor() {
        super({
            realm: process.env.KEYCLOAK_REALM || 'chariot',
            url: process.env.KEYCLOAK_INTERNAL_URL,
        });
    } async validate(payload: any) {
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
