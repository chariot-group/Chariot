import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { Public } from '@/common/decorators/public.decorator';
import * as promClient from 'prom-client';

@Controller()
export class MetricsController {
    @Public()
    @Get('metrics')
    async getMetrics(@Res() res: Response) {
        res.set('Content-Type', promClient.register.contentType);
        const metrics = await promClient.register.metrics();
        res.send(metrics);
    }
}
