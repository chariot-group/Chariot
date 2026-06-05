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
        this.keycloakInternalUrl = this.configService.get<string>(
            'KEYCLOAK_INTERNAL_URL',
        );
        this.keycloakExternalUrl =
            this.configService.get<string>('KEYCLOAK_URL');
        this.realm = this.configService.get<string>('KEYCLOAK_REALM');
        this.clientId = this.configService.get<string>('KEYCLOAK_CLIENT_ID');

        if (!this.keycloakInternalUrl || !this.realm) {
            const message =
                'KEYCLOAK_INTERNAL_URL and KEYCLOAK_REALM must be defined';
            this.logger.error(message, null, this.SERVICE_NAME);
            throw new InternalServerErrorException(message);
        }

        this.logger.verbose(
            `Keycloak Auth Guard initialized with internal URL: ${this.keycloakInternalUrl}`,
            this.SERVICE_NAME,
        );

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

        const isPublic = this.reflector.getAllAndOverride<boolean>(
            IS_PUBLIC_KEY,
            [context.getHandler(), context.getClass()],
        );

        if (isPublic) {
            return true;
        }

        const authHeader = request.headers.authorization;

        if (!authHeader) {
            const message = 'No authorization header';
            this.logger.error(message, null, this.SERVICE_NAME);
            throw new UnauthorizedException(message);
        }

        const [bearer, token] = authHeader.split(' ');

        if (bearer !== 'Bearer' || !token) {
            const message = 'Invalid authorization format';
            this.logger.error(message, null, this.SERVICE_NAME);
            throw new UnauthorizedException(message);
        }

        try {
            const decoded = await this.verifyToken(token);

            if (!decoded.sub) {
                const message = 'Invalid token: missing sub claim';
                this.logger.error(message, null, this.SERVICE_NAME);
                throw new UnauthorizedException(message);
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
            const message = `Token validation failed: ${error.message}`;
            this.logger.error(message, null, this.SERVICE_NAME);
            throw new UnauthorizedException(message);
        }
    }

    private async verifyToken(token: string): Promise<any> {
        return new Promise((resolve, reject) => {
            const decodedHeader = jwt.decode(token, { complete: true });

            if (!decodedHeader || typeof decodedHeader === 'string') {
                const message = 'Invalid token structure';
                this.logger.error(message, null, this.SERVICE_NAME);
                return reject(new InternalServerErrorException(message));
            }

            const kid = decodedHeader.header.kid;

            if (!kid) {
                const message = 'No kid in token header';
                this.logger.error(message, null, this.SERVICE_NAME);
                return reject(new InternalServerErrorException(message));
            }

            this.jwksClient.getSigningKey(kid, (err, key) => {
                if (err) {
                    const message = `Error getting signing key: ${err.message}`;
                    this.logger.error(message, err.stack, this.SERVICE_NAME);
                    return reject(new InternalServerErrorException(message));
                }

                const signingKey = key.getPublicKey();

                jwt.verify(
                    token,
                    signingKey,
                    { algorithms: ['RS256'] },
                    (verifyErr, decoded) => {
                        if (verifyErr) {
                            const message = `JWT verify error: ${verifyErr.message}`;
                            this.logger.error(
                                message,
                                verifyErr.stack,
                                this.SERVICE_NAME,
                            );
                            return reject(
                                new InternalServerErrorException(message),
                            );
                        }

                        const validIssuers = [
                            `${this.keycloakInternalUrl}/realms/${this.realm}`,
                            `${this.keycloakExternalUrl}/realms/${this.realm}`,
                        ].filter(Boolean);

                        const payload = decoded as jwt.JwtPayload;
                        if (
                            payload.iss &&
                            !validIssuers.includes(payload.iss)
                        ) {
                            const message = `Invalid issuer: ${payload.iss}. Expected one of: ${validIssuers.join(', ')}`;
                            this.logger.error(
                                message,
                                null,
                                this.SERVICE_NAME,
                            );
                            return reject(
                                new InternalServerErrorException(message),
                            );
                        }

                        resolve(payload);
                    },
                );
            });
        });
    }
}
