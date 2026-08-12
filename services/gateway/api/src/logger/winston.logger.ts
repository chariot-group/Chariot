import * as winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import { utilities as nestWinstonModuleUtilities } from "nest-winston";
import { createLokiTransport } from "../observability/loki.transport";

const SERVICE = "gateway";
const logLevel = process.env.GATEWAY_LOG_LEVEL || "info";
const lokiTransport = createLokiTransport(SERVICE);

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

export const instance = winston.createLogger({
  level: logLevel,
  // No defaultMeta.service — Loki stream label already carries service=gateway
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
  ),
  transports: [
    errorTransport,
    combinedTransport,
    consoleTransport,
    ...(lokiTransport ? [lokiTransport] : []),
  ],
});

instance.info("Winston logger initialized for Gateway", {
  level: logLevel,
  environment: process.env.NODE_ENV,
});
