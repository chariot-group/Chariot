import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module';
import { WinstonModule } from 'nest-winston';
import { instance } from '@/logger/winston.logger';
import { ValidationPipe } from '@nestjs/common';
import { MetricsInterceptor } from '@/metrics/metrics.interceptor';
import cookieParser from 'cookie-parser';
import * as express from 'express';
import { ErrorDetailsFilter } from '@/common/filters/errors.filter';
import { setupSwagger } from '@/config/swagger.config';
import { SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        logger: WinstonModule.createLogger({
            instance: instance,
        }),
    });

    // CORS Configuration - Service interne, accepte toutes les requêtes
    // La validation CORS est gérée par la Gateway qui est le seul point d'entrée public
    app.enableCors({
        origin: true,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
        exposedHeaders: ['Authorization'],
    });

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(cookieParser());

    app.useGlobalFilters(new ErrorDetailsFilter());

    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

    const metricsInterceptor = app.get(MetricsInterceptor);
    app.useGlobalInterceptors(metricsInterceptor);

    const document = setupSwagger(app);
    SwaggerModule.setup('/docs', app, document, {
        swaggerOptions: {
            persistAuthorization: true,
            oauth2RedirectUrl: `${process.env.PAYMENT_URL}/oauth2-redirect.html`,
            initOAuth: {
                clientId: process.env.KEYCLOAK_CLIENT_ID,
                scopes: ['openid', 'profile', 'email'],
                usePkceWithAuthorizationCodeGrant: true,
            },
        },
    });

    const port = 9003;
    await app.listen(port);

    instance.info(`Chariot Payment API running on port ${port}`);
}
bootstrap();
