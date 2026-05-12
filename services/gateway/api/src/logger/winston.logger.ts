import * as winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import { utilities as nestWinstonModuleUtilities } from "nest-winston";

const logLevel = process.env.GATEWAY_LOG_LEVEL || "info";

// Transport pour les erreurs
const errorTransport = new DailyRotateFile({
  dirname: "logger/logs",
  filename: "error-%DATE%.log",
  datePattern: "YYYY-MM-DD",
  zippedArchive: true,
  maxSize: "20m",
  maxFiles: "14d",
  level: "error",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
});

// Transport pour tous les logs
const combinedTransport = new DailyRotateFile({
  dirname: "logger/logs",
  filename: "combined-%DATE%.log",
  datePattern: "YYYY-MM-DD",
  zippedArchive: true,
  maxSize: "20m",
  maxFiles: "14d",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
});

// Transport console avec couleurs en développement
const consoleTransport = new winston.transports.Console({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.ms(),
    nestWinstonModuleUtilities.format.nestLike("Gateway", {
      colors: true,
      prettyPrint: true,
    }),
  ),
});

// Instance Winston pour l'API Gateway
export const instance = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json(),
  ),
  defaultMeta: { service: "chariot-gateway" },
  transports: [errorTransport, combinedTransport, consoleTransport],
});

// Log de démarrage
instance.info("Winston logger initialized for Gateway", {
  level: logLevel,
  environment: process.env.NODE_ENV,
});
