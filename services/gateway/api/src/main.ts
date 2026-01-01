import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module';
import { WinstonModule } from 'nest-winston';
import { instance } from '@/logger/winston.logger';
import { ValidationPipe, Logger } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import * as express from 'express';
import helmet from 'helmet';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger({
      instance: instance,
    }),
  });

  // Security headers
  app.use(helmet());

  // CORS Configuration
  const allowedOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',')
    : ['http://localhost:3000'];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
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

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = process.env.GATEWAY_PORT || 8082;
  await app.listen(port, '0.0.0.0');

  logger.log(`Chariot API Gateway running on port ${port}`);
  logger.log(`Environment: ${process.env.NODE_ENV}`);
  logger.log(`Allowed origins: ${allowedOrigins.join(', ')}`);
}

bootstrap();
