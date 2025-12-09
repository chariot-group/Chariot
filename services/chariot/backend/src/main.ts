import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from '@/app.module';
import { WinstonModule } from 'nest-winston';
import { instance } from '@/logger/winston.logger';
import { ValidationPipe } from '@nestjs/common';
import { KeycloakAuthGuard } from '@/common/guards/keycloak-auth.guard';
import { MetricsInterceptor } from '@/metrics/metrics.interceptor';
import * as cookieParser from 'cookie-parser';
import * as express from 'express';

async function bootstrap() {
  // Utiliser le module dev en développement, prod en production
  let AppModuleToUse = AppModule;

  if (process.env.NODE_ENV !== 'production') {
    const { AppModuleDev } = await import('@/app.module.dev');
    AppModuleToUse = AppModuleDev;
  }

  const app = await NestFactory.create(AppModuleToUse, {
    logger: WinstonModule.createLogger({
      instance: instance,
    }),
  });

  app.enableCors({
    origin: `${process.env.CHARIOT_FRONTEND_URL}`,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Body parser is already included in NestJS via express
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use(cookieParser());

  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  const reflector = app.get(Reflector);
  app.useGlobalGuards(new KeycloakAuthGuard(reflector));

  const metricsInterceptor = app.get(MetricsInterceptor);
  app.useGlobalInterceptors(metricsInterceptor);

  await app.listen(process.env.CHARIOT_INTERNAL_API_PORT);

  console.log('Chariot API running on port:', process.env.CHARIOT_API_PORT ?? 3000);
}
bootstrap();
