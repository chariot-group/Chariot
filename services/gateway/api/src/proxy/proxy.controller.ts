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

  constructor(private readonly proxyService: ProxyService) { }

  @All('*')
  async proxyRequest(@Req() req: Request, @Res() res: Response) {
    try {
      // Handle OPTIONS preflight requests locally (CORS)
      // Do not forward to backend services
      if (req.method === 'OPTIONS') {
        return res.status(204).end();
      }

      // Extract service name and path from URL
      // Expected format: /api/{service}/{path}
      const urlWithoutPrefix = req.originalUrl.replace(/^\/api/, '');
      const segments = urlWithoutPrefix.split('/').filter(Boolean);

      if (segments.length === 0) {
        // No service specified - return available services
        const services = this.proxyService.getAvailableServices();
        return res.status(200).json({
          message: 'API Gateway',
          available_services: services,
        });
      }

      // Check if first segment is a configured service
      const potentialService = segments[0];
      let serviceName: string;
      let targetPath: string;

      if (this.proxyService.hasService(potentialService)) {
        // First segment is a service name: /api/{service}/{path}
        serviceName = potentialService;
        targetPath = '/' + segments.slice(1).join('/');
      } else {
        // Fallback to Adventure service for backward compatibility: /api/{path}
        serviceName = 'adventure';
        targetPath = '/' + segments.join('/');
        this.logger.debug(
          `No service '${potentialService}' found, falling back to adventure service`,
        );
      }

      // Preserve query string if present
      const queryString = req.originalUrl.includes('?')
        ? '?' + req.originalUrl.split('?')[1]
        : '';
      const fullTargetPath = targetPath + queryString;

      this.logger.debug(
        `Proxying request to ${serviceName} service: ${req.method} ${fullTargetPath}`,
      );

      const response = await this.proxyService.forward(
        serviceName,
        req.method,
        fullTargetPath,
        req.body,
        req.headers as Record<string, string>,
      );

      // Forward response headers but filter out CORS headers
      // CORS is managed at gateway level only
      const corsHeaders = [
        'access-control-allow-origin',
        'access-control-allow-credentials',
        'access-control-allow-methods',
        'access-control-allow-headers',
        'access-control-expose-headers',
        'access-control-max-age',
      ];

      Object.entries(response.headers).forEach(([key, value]) => {
        const lowerKey = key.toLowerCase();
        if (
          lowerKey !== 'transfer-encoding' &&
          !corsHeaders.includes(lowerKey)
        ) {
          res.setHeader(key, value as string);
        }
      });

      res.status(response.status).send(response.data);
    } catch (error) {
      this.logger.error(`Proxy error: ${error.message}`, error.stack);

      if (error.response) {
        res.status(error.response.status).send(error.response.data);
      } else if (error.status) {
        // Handle NestJS exceptions (like BadRequestException)
        res.status(error.status).json({
          statusCode: error.status,
          message: error.message,
          error: error.name,
        });
      } else {
        throw new HttpException(
          'Service temporarily unavailable',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }
    }
  }
}
