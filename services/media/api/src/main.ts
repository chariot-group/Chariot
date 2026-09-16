import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module';
import { WinstonModule } from 'nest-winston';
import { instance } from '@/logger/winston.logger';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ErrorDetailsFilter } from '@/common/filters/errors.filter';
import { initTracing } from '@/observability/tracing';
import { metricsBasicAuthMiddleware } from '@/observability/metrics-auth.middleware';
import { MetricsInterceptor } from '@/metrics/metrics.interceptor';

async function bootstrap() {
  await initTracing('chariot-media');
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger({ instance }),
  });

  app.use(metricsBasicAuthMiddleware);

  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Authorization'],
  });

  app.useGlobalFilters(new ErrorDetailsFilter());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  const metricsInterceptor = app.get(MetricsInterceptor);
  app.useGlobalInterceptors(metricsInterceptor);

  const config = new DocumentBuilder()
    .setTitle('Chariot Media API')
    .setDescription('CDN & media management service for Chariot')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  if (process.env.NODE_ENV !== 'production') {
    SwaggerModule.setup('/docs', app, document);
  }

  const port = 9005;
  await app.listen(port);
  instance.info(`Chariot Media API running on port ${port}`);
}
bootstrap();
