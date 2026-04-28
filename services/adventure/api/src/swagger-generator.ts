import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module';
import { setupSwagger } from '@/config/swagger.config';
import * as fs from 'fs';
import * as path from 'path';
import { OpenAPIObject } from '@nestjs/swagger';

async function generateSwagger() {
  try {
    const app = await NestFactory.create(AppModule, { logger: false });

    console.log('🔄 Génération de la documentation Swagger...');
    const document: OpenAPIObject = setupSwagger(app);

    const outputPath: string = path.join(__dirname, '../swagger.json');
    fs.writeFileSync(outputPath, JSON.stringify(document, null, 2));

    console.log('✅ swagger.json généré avec succès');

    await app.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de la génération :');
    console.error(error);
    process.exit(1);
  }
}

generateSwagger();
