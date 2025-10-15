import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { Public } from '@/common/decorators/public.decorator';
import * as promClient from 'prom-client';

@Controller()
export class MetricsController {
  /**
   * Endpoint GET /metrics
   * Format texte compatible Prometheus
   * 
   * Exemple de sortie:
   * # HELP chariot_http_requests_total Total number of HTTP requests
   * # TYPE chariot_http_requests_total counter
   * chariot_http_requests_total{method="GET",route="/campaigns",status="200"} 42
   */
  @Public()
  @Get('metrics')
  async getMetrics(@Res() res: Response) {
    res.set('Content-Type', promClient.register.contentType);
    const metrics = await promClient.register.metrics();
    res.send(metrics);
  }
}
