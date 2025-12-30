import {
  Controller,
  All,
  Req,
  Res,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ProxyService } from '@/proxy/proxy.service';

@Controller('api')
export class ProxyController {
  private readonly logger = new Logger(ProxyController.name);

  constructor(private readonly proxyService: ProxyService) {}

  @All('*')
  async proxyRequest(@Req() req: Request, @Res() res: Response) {
    try {
      const targetUrl = req.originalUrl.replace(/^\/api/, '');
      this.logger.debug(`Proxying request to adventure service: ${req.method} ${targetUrl}`);

      const response = await this.proxyService.forwardToAdventure(
        req.method,
        targetUrl,
        req.body,
        req.headers as Record<string, string>,
      );

      // Forward response headers
      Object.entries(response.headers).forEach(([key, value]) => {
        if (key.toLowerCase() !== 'transfer-encoding') {
          res.setHeader(key, value as string);
        }
      });

      res.status(response.status).send(response.data);
    } catch (error) {
      this.logger.error(`Proxy error: ${error.message}`, error.stack);

      if (error.response) {
        res.status(error.response.status).send(error.response.data);
      } else {
        throw new HttpException(
          'Service temporarily unavailable',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }
    }
  }
}
