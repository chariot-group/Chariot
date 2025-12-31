import { NestFactory } from "@nestjs/core";
import { AppModule } from "@/app.module";
import { setupSwagger } from "@/config/swagger.config";
import * as fs from "fs";

async function generateSwagger() {
    const app = await NestFactory.create(AppModule, { logger: false });

    const document = setupSwagger(app);
    fs.writeFileSync("./swagger.json", JSON.stringify(document, null, 2));

    console.log("✅ swagger.json généré");

    await app.close();
}

generateSwagger();
