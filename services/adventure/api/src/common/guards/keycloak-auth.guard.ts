import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
    Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '@/common/decorators/public.decorator';
import * as jwt from 'jsonwebtoken';
import * as jwksClient from 'jwks-rsa';

@Injectable()
export class KeycloakAuthGuard implements CanActivate {
    private readonly logger = new Logger(KeycloakAuthGuard.name);
    private jwksClient: jwksClient.JwksClient;
    private keycloakInternalUrl: string;
    private keycloakExternalUrl: string;
    private realm: string;
    private clientId: string;

    constructor(private reflector: Reflector) {
        // URL interne pour récupérer les clés JWKS
        this.keycloakInternalUrl = process.env.KEYCLOAK_INTERNAL_URL;
        // URL externe pour accepter les tokens émis par le frontend
        this.keycloakExternalUrl = process.env.KEYCLOAK_URL;
        this.realm = process.env.KEYCLOAK_REALM;
        this.clientId = process.env.KEYCLOAK_CLIENT_ID;

        if (!this.keycloakInternalUrl || !this.realm) {
            throw new Error('KEYCLOAK_INTERNAL_URL and KEYCLOAK_REALM must be defined');
        }

        const jwksUri = `${this.keycloakInternalUrl}/realms/${this.realm}/protocol/openid-connect/certs`;

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
            this.logger.error('No authorization header');
            throw new UnauthorizedException('No authorization header');
        }

        const [bearer, token] = authHeader.split(' ');

        if (bearer !== 'Bearer' || !token) {
            this.logger.error('Invalid authorization format');
            throw new UnauthorizedException('Invalid authorization format');
        }

        try {
            // Valider et décoder le token
            const decoded = await this.verifyToken(token);

            // Debug: voir le contenu du token décodé
            this.logger.debug(`Decoded token: ${JSON.stringify(decoded)}`);

            // Attacher les informations de l'utilisateur à la requête
            // Note: Utiliser preferred_username comme fallback si sub n'est pas disponible
            const userId = decoded.sub || decoded.preferred_username || decoded.email;
            
            if (!userId) {
                this.logger.error('No user identifier found in token (sub, preferred_username, or email)');
                throw new UnauthorizedException('Invalid token: no user identifier');
            }

            request.user = {
                keycloakId: userId,
                email: decoded.email,
                username: decoded.preferred_username,
                realm_access: decoded.realm_access,
                resource_access: decoded.resource_access,
            };

            return true;
        } catch (error) {
            this.logger.error(`Token validation failed: ${error.message}`, error.stack);
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
                    this.logger.error(`Error getting signing key: ${err.message}`, err.stack);
                    return reject(err);
                }

                const signingKey = key.getPublicKey();

                // Vérifier le token avec la clé publique (sans vérifier l'issuer strictement)
                jwt.verify(
                    token,
                    signingKey,
                    {
                        algorithms: ['RS256'],
                        // Ne pas vérifier l'issuer ici, on le valide manuellement après
                    },
                    (verifyErr, decoded) => {
                        if (verifyErr) {
                            this.logger.error(`JWT verify error: ${verifyErr.message}`, verifyErr.stack);
                            return reject(verifyErr);
                        }

                        // Valider manuellement l'issuer (accepter URL interne ou externe)
                        const validIssuers = [
                            `${this.keycloakInternalUrl}/realms/${this.realm}`,
                            `${this.keycloakExternalUrl}/realms/${this.realm}`,
                        ].filter(Boolean);

                        const payload = decoded as jwt.JwtPayload;
                        if (payload.iss && !validIssuers.includes(payload.iss)) {
                            this.logger.error(`Invalid issuer: ${payload.iss}. Expected one of: ${validIssuers.join(', ')}`);
                            return reject(new Error('Invalid token issuer'));
                        }

                        resolve(decoded);
                    },
                );
            });
        });
    }
}