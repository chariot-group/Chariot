import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ProblemDetailsDto } from '@/common/dtos/errors.dto';

type HttpExceptionResponse = {
  error?: string;
  message?: string | string[];
};

@Catch()
export class ErrorDetailsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const base: ProblemDetailsDto = {
      type: `https://httpstatuses.io/${status}`,
      title: HttpStatus[status],
      status,
      instance: req.url,
    };

    const body: ProblemDetailsDto = { ...base };

    if (isHttpException) {
      const response = exception.getResponse();
      const responseObj =
        typeof response === 'object' && response !== null
          ? (response as HttpExceptionResponse)
          : undefined;

      body.title = responseObj?.error || body.title;

      const messages = responseObj?.message;
      if (Array.isArray(messages)) {
        body.detail = 'Validation failed';
        body['invalid-params'] = messages.map((msg) => {
          const [field, ...rest] = msg.split(' ');
          return { name: field, reason: rest.join(' ') };
        });
        return res.status(status).json(body);
      }

      if (typeof response === 'string') {
        body.detail = response;
      } else if (responseObj) {
        const { message } = responseObj;
        if (typeof message === 'string') {
          body.detail = message;
        } else if (Array.isArray(message)) {
          body.detail = 'Validation failed';
          body['invalid-params'] = message.map((msg) => {
            const [field, ...rest] = msg.split(' ');
            return { name: field, reason: rest.join(' ') };
          });
        }
      }
    } else {
      body.detail =
        exception instanceof Error ? exception.message : 'Unexpected error';
    }

    return res.status(status).json(body);
  }
}
