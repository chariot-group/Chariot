import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
    Logger,
    OnModuleInit,
    InternalServerErrorException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { IS_PUBLIC_KEY } from '@/common/decorators/public.decorator';
import * as jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

@Injectable()
export class KeycloakAuthGuard implements CanActivate, OnModuleInit {
    private readonly logger = new Logger(KeycloakAuthGuard.name);
    private readonly SERVICE_NAME = KeycloakAuthGuard.name;

    private jwksClient: jwksClient.JwksClient;
    private keycloakInternalUrl: string;
    private keycloakExternalUrl: string;
    private realm: string;
    private clientId: string;

    constructor(
        private reflector: Reflector,
        private configService: ConfigService,
    ) { }

    onModuleInit() {
        this.keycloakInternalUrl = this.configService.get<string>('KEYCLOAK_INTERNAL_URL');
        this.keycloakExternalUrl = this.configService.get<string>('KEYCLOAK_URL');
        this.realm = this.configService.get<string>('KEYCLOAK_REALM');
        this.clientId = this.configService.get<string>('KEYCLOAK_CLIENT_ID');

        if (!this.keycloakInternalUrl || !this.realm) {
            let message: string = 'KEYCLOAK_INTERNAL_URL and KEYCLOAK_REALM must be defined';
            this.logger.error(message, null, this.SERVICE_NAME);
            throw new InternalServerErrorException(message);
        }

        this.logger.log(`Keycloak Auth Guard initialized with internal URL: ${this.keycloakInternalUrl}`, this.SERVICE_NAME);

        const jwksUri = `${this.keycloakInternalUrl}/realms/${this.realm}/protocol/openid-connect/certs`;

        this.jwksClient = jwksClient({
            jwksUri,
            cache: true,
            cacheMaxAge: 86400000,
        });
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();

        if (request.method === 'OPTIONS') {
            return true;
        }

        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (isPublic) {
            return true;
        }

        const authHeader = request.headers.authorization;

        if (!authHeader) {
            this.logger.debug('No authorization header', this.SERVICE_NAME);
            throw new UnauthorizedException('No authorization header');
        }

        const [bearer, token] = authHeader.split(' ');

        if (bearer !== 'Bearer' || !token) {
            this.logger.debug('Invalid authorization format', this.SERVICE_NAME);
            throw new UnauthorizedException('Invalid authorization format');
        }

        try {
            const decoded = await this.verifyToken(token);

            if (!decoded.sub) {
                this.logger.warn("Invalid token: missing 'sub' claim", this.SERVICE_NAME);
                throw new UnauthorizedException('Invalid token: missing user ID (sub claim)');
            }

            request.user = {
                keycloakId: decoded.sub,
                email: decoded.email,
                username: decoded.preferred_username,
                realm_access: decoded.realm_access,
                resource_access: decoded.resource_access,
            };

            return true;
        } catch (error: any) {
            if (error instanceof UnauthorizedException) {
                throw error;
            }
            this.logger.warn(`Token validation failed: ${error.message}`, this.SERVICE_NAME);
            throw new UnauthorizedException('Invalid token');
        }
    }

    private async verifyToken(token: string): Promise<any> {
        return new Promise((resolve, reject) => {
            const decodedHeader = jwt.decode(token, { complete: true });

            if (!decodedHeader || typeof decodedHeader === 'string') {
                return reject(new Error('Invalid token structure'));
            }

            const kid = decodedHeader.header.kid;

            if (!kid) {
                return reject(new Error('No kid in token header'));
            }

            this.jwksClient.getSigningKey(kid, (err, key) => {
                if (err) {
                    let message: string = `Error getting signing key: ${err.message}`;
                    this.logger.error(message, err.stack, this.SERVICE_NAME);
                    return reject(new InternalServerErrorException(message));
                }

                const signingKey = key.getPublicKey();

                jwt.verify(
                    token,
                    signingKey,
                    {
                        algorithms: ['RS256'],
                    },
                    (verifyErr, decoded) => {
                        if (verifyErr) {
                            this.logger.debug(`JWT verify error: ${verifyErr.message}`, this.SERVICE_NAME);
                            return reject(verifyErr);
                        }

                        const validIssuers = [
                            `${this.keycloakInternalUrl}/realms/${this.realm}`,
                            `${this.keycloakExternalUrl}/realms/${this.realm}`,
                        ].filter(Boolean);

                        const payload = decoded as jwt.JwtPayload;
                        if (payload.iss && !validIssuers.includes(payload.iss)) {
                            this.logger.warn(
                                `Invalid issuer: ${payload.iss}. Expected one of: ${validIssuers.join(', ')}`,
                                this.SERVICE_NAME,
                            );
                            return reject(new Error('Invalid token issuer'));
                        }

                        resolve(decoded);
                    },
                );
            });
        });
    }
}
