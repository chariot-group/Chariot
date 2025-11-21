import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module';
import { SeederService } from '@/seeder/seeder.service';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const SERVICE_NAME: string = 'SEEDER';

  const start: number = Date.now();
  Logger.log('Creating an application context...', SERVICE_NAME);

  const app = await NestFactory.createApplicationContext(AppModule);

  Logger.log('Application context created', SERVICE_NAME);
  Logger.log('Database currently being filled', SERVICE_NAME);

  const args = process.argv.slice(2);
  const clean = args.includes('--clean');

  const seederService = app.get(SeederService);
  await seederService.seed(clean);

  const end: number = Date.now();
  Logger.log(`Database ready (${end - start}ms)`, SERVICE_NAME);

  await app.close();
}

bootstrap();
