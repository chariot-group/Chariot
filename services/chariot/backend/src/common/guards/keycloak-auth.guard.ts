import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '@/common/decorators/public.decorator';
import * as jwt from 'jsonwebtoken';
import * as jwksClient from 'jwks-rsa';

@Injectable()
export class KeycloakAuthGuard implements CanActivate {
    private jwksClient: jwksClient.JwksClient;
    private keycloakUrl: string;
    private realm: string;
    private clientId: string;

    constructor(private reflector: Reflector) {
        this.keycloakUrl = process.env.KEYCLOAK_URL;
        this.realm = process.env.KEYCLOAK_REALM;
        this.clientId = process.env.KEYCLOAK_CLIENT_ID;

        if (!this.keycloakUrl || !this.realm) {
            throw new Error('KEYCLOAK_URL and KEYCLOAK_REALM must be defined');
        }

        const jwksUri = `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/certs`;

        this.jwksClient = jwksClient({
            jwksUri,
            cache: true,
            cacheMaxAge: 86400000, // 24 heures
        });
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();

        // Permettre les requêtes OPTIONS (CORS preflight)
        if (request.method === 'OPTIONS') {
            return true;
        }

        // Vérifier si la route est publique
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (isPublic) {
            return true;
        }

        // Extraire le token
        const authHeader = request.headers.authorization;

        if (!authHeader) {
            console.error('❌ No authorization header');
            throw new UnauthorizedException('No authorization header');
        }

        const [bearer, token] = authHeader.split(' ');

        if (bearer !== 'Bearer' || !token) {
            console.error('❌ Invalid authorization format');
            throw new UnauthorizedException('Invalid authorization format');
        }

        try {
            // Valider et décoder le token
            const decoded = await this.verifyToken(token);

            // Attacher les informations de l'utilisateur à la requête
            request.user = {
                keycloakId: decoded.sub,
                email: decoded.email,
                username: decoded.preferred_username,
                realm_access: decoded.realm_access,
                resource_access: decoded.resource_access,
            };

            return true;
        } catch (error) {
            console.error('❌ Token validation failed:', error.message);
            throw new UnauthorizedException('Invalid token');
        }
    }

    private async verifyToken(token: string): Promise<any> {
        return new Promise((resolve, reject) => {
            // Décoder le header pour obtenir le kid (key ID)
            const decodedHeader = jwt.decode(token, { complete: true });

            if (!decodedHeader || typeof decodedHeader === 'string') {
                return reject(new Error('Invalid token structure'));
            }

            const kid = decodedHeader.header.kid;

            if (!kid) {
                return reject(new Error('No kid in token header'));
            }

            // Récupérer la clé publique correspondante
            this.jwksClient.getSigningKey(kid, (err, key) => {
                if (err) {
                    console.error('Error getting signing key:', err);
                    return reject(err);
                }

                const signingKey = key.getPublicKey();

                // Vérifier le token avec la clé publique
                jwt.verify(
                    token,
                    signingKey,
                    {
                        algorithms: ['RS256'],
                        issuer: `${this.keycloakUrl}/realms/${this.realm}`,
                        audience: this.clientId, // Optionnel, décommenter si nécessaire
                    },
                    (verifyErr, decoded) => {
                        if (verifyErr) {
                            console.error('JWT verify error:', verifyErr.message);
                            return reject(verifyErr);
                        }
                        resolve(decoded);
                    },
                );
            });
        });
    }
}