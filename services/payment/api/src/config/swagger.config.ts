import { InvalidParamDto, ProblemDetailsDto } from '@/common/dtos/errors.dto';
import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export const swaggerConfig = new DocumentBuilder()
    .setTitle('Payment API')
    .setDescription('Chariot Payment API — gestion des paiements, codes promo et affiliations')
    .setVersion(process.env.PAYMENT_VERSION || 'unknown')
    .addServer(`${process.env.PAYMENT_URL || 'http://localhost:9003'}`)
    .addOAuth2({
        type: 'oauth2',
        flows: {
            authorizationCode: {
                authorizationUrl: `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/auth`,
                tokenUrl: `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/token`,
                scopes: {
                    openid: 'OpenID Connect',
                },
            },
        },
    })
    .build();

export function setupSwagger(app: INestApplication) {
    return SwaggerModule.createDocument(app, swaggerConfig, {
        extraModels: [ProblemDetailsDto, InvalidParamDto],
    });
}
