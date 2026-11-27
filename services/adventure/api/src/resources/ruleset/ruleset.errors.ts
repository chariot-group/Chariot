import {
  BadRequestException,
  ConflictException,
  HttpException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';

const MONGO_DUPLICATE_KEY = 11000;

/** Keeps HTTP errors, maps Mongo duplicate keys to 409, wraps the rest in a 500. */
export function toHttpError(
  error: unknown,
  action: string,
  logger: Logger,
): HttpException {
  if (error instanceof HttpException) return error;
  if ((error as { code?: number })?.code === MONGO_DUPLICATE_KEY) {
    return new ConflictException(`${action}: duplicate key`);
  }
  const message = `${action}: ${(error as Error)?.message}`;
  logger.error(message);
  return new InternalServerErrorException(message);
}

/** 400 with one `invalid-params` item per integrity error. */
export function assertNoIntegrityErrors(errors: string[]): void {
  if (errors.length > 0) {
    throw new BadRequestException(errors);
  }
}
