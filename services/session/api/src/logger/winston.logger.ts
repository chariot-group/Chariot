import { createLogger, format, transports } from 'winston';
import { createLokiTransport } from '@/observability/loki.transport';

const SERVICE = 'session';
const isDev = process.env.NODE_ENV === 'development';
const logLevel =
  process.env.LOG_LEVEL || (isDev ? 'debug' : 'info');

const consoleFormat = isDev
  ? format.combine(
      format.colorize({ all: true }),
      format.printf(({ timestamp, level, message, context, stack }) => {
        const scope = context ? `${SERVICE}/${context}` : SERVICE;
        return `${timestamp} ${level} [${scope}] ${stack || message}`;
      }),
    )
  : format.json();

const lokiTransport = createLokiTransport(SERVICE);

export const instance = createLogger({
  level: logLevel,
  // service/environment only as Loki stream labels — not duplicated in the line body
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    format.errors({ stack: true }),
  ),
  transports: [
    new transports.Console({
      level: isDev ? 'silly' : logLevel,
      format: consoleFormat,
    }),
    new transports.File({
      filename: 'logger/logs/error.log',
      level: 'error',
      format: format.json(),
    }),
    new transports.File({
      filename: 'logger/logs/combine.log',
      level: 'info',
      format: format.json(),
    }),
    ...(lokiTransport ? [lokiTransport] : []),
  ],
});
