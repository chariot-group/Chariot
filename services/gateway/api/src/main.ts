import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { WinstonModule } from "nest-winston";
import { instance } from "./logger/winston.logger";
import { ValidationPipe, Logger } from "@nestjs/common";
import cookieParser from "cookie-parser";
import * as express from "express";
import helmet from "helmet";
import { initTracing } from "./observability/tracing";
import { metricsBasicAuthMiddleware } from "./observability/metrics-auth.middleware";

type RawBodyRequest = express.Request & { rawBody?: Buffer };

function isMultipartContentType(contentType: string | undefined): boolean {
  return typeof contentType === "string" && contentType.includes("multipart/form-data");
}

const normalizeOrigin = (origin: string): string => origin.trim().replace(/\/+$/, "");

async function bootstrap() {
  const logger = new Logger("Bootstrap");
  await initTracing("chariot-gateway");

  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger({
      instance: instance,
    }),
  });

  app.use(metricsBasicAuthMiddleware);

  // Security headers
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );

  // CORS Configuration - Gateway handles all CORS like Keycloak does
  const allowedOrigins = normalizeOrigin(process.env.FRONTEND_URL || "http://localhost:3000,http://localhost:3001")
    .split(",")
    .map((origin) => normalizeOrigin(origin))
    .filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like curl, postman, server-to-server)
      if (!origin) return callback(null, true);

      const normalizedRequestOrigin = normalizeOrigin(origin);

      // Check if origin matches any allowed origin
      if (allowedOrigins.includes(normalizedRequestOrigin)) {
        callback(null, true);
      } else {
        logger.warn(`CORS blocked origin: ${origin}`);
        callback(null, false);
      }
    },
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
    exposedHeaders: ["Authorization"],
  });

  // Buffer multipart uploads so the proxy can forward exact bytes (stream piping via axios is unreliable).
  app.use((req: RawBodyRequest, res, next) => {
    if (!isMultipartContentType(req.headers["content-type"])) {
      next();
      return;
    }

    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => {
      req.rawBody = Buffer.concat(chunks);
      next();
    });
    req.on("error", (error) => next(error));
  });

  app.use(
    express.json({
      limit: "10mb",
      verify: (req: RawBodyRequest, _res, buf) => {
        req.rawBody = buf;
      },
    }),
  );
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));
  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = process.env.GATEWAY_PORT || 8082;
  await app.listen(port, "0.0.0.0");

  logger.log(`Chariot API Gateway running on port ${port}`);
  logger.log(`Environment: ${process.env.NODE_ENV}`);
  logger.log(`Allowed CORS origins: ${allowedOrigins.join(", ")}`);
}

bootstrap();
