import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from '@/app.module';
import { WinstonModule, WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { instance } from '@/logger/winston.logger';
import { ValidationPipe } from '@nestjs/common';
import { KeycloakAuthGuard } from '@/common/guards/keycloak-auth.guard';
import { MetricsInterceptor } from '@/metrics/metrics.interceptor';
import * as cookieParser from 'cookie-parser';
import * as express from 'express';
import { ErrorDetailsFilter } from '@/common/filters/errors.filter';
import { setupSwagger } from '@/config/swagger.config';
import { SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  let AppModuleToUse = AppModule;

  const app = await NestFactory.create(AppModuleToUse, {
    logger: WinstonModule.createLogger({
      instance: instance,
    }),
  });

  // CORS Configuration améliorée
  const allowedOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',')
    : ['http://localhost:3000'];

  app.enableCors({
    origin: (origin, callback) => {
      // Autoriser les requêtes sans origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);

      if (allowedOrigins.some(allowedOrigin => origin.startsWith(allowedOrigin))) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
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

  const reflector = app.get(Reflector);
  app.useGlobalGuards(new KeycloakAuthGuard(reflector));

  const metricsInterceptor = app.get(MetricsInterceptor);
  app.useGlobalInterceptors(metricsInterceptor);

  const document = setupSwagger(app);
  SwaggerModule.setup("/docs", app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      oauth2RedirectUrl: `${process.env.ADVENTURE_URL}/oauth2-redirect.html`,
      initOAuth: {
        clientId: process.env.KEYCLOAK_CLIENT_ID,
        scopes: ["openid", "profile", "email"],
        usePkceWithAuthorizationCodeGrant: true,
      },
    },
  });

  const port = 9000;
  await app.listen(port);

  console.log(`Chariot API running on port ${port}`);
}
bootstrap();