import { createLogger, format, transports } from 'winston';

const customFormat = format.printf(
  ({ timestamp, level, stack, message, context }) => {
    return `${timestamp} - ${level}: [${context}] ${message || stack}`;
  },
);

const options = {
  errorFile: {
    filename: 'logger/logs/error.log',
    level: 'error',
  },
  combineFile: {
    filename: 'logger/logs/combine.log',
    level: 'info',
  },
  console: {
    level: 'silly',
  },
};

const devLogger = {
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    format.colorize({ all: true }),
    format.align(),
    format.errors({ stack: true }),
    customFormat,
  ),
  transports: [
    new transports.Console(options.console),
    new transports.File(options.errorFile),
    new transports.File(options.combineFile),
  ],
};

const prodLogger = {
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    format.errors({ stack: true }),
    format.json(),
  ),
  transports: [
    new transports.Console(options.console),
    new transports.File(options.errorFile),
    new transports.File(options.combineFile),
  ],
};

const instanceLogger =
  process.env.NODE_ENV === 'development' ? devLogger : prodLogger;

export const instance = createLogger(instanceLogger);
