import { Logger, Controller, Get, Res } from '@nestjs/common';
import { AppService } from '@/app.service';
import { PrismaService } from '@/prisma/prisma.service';
import { Public } from '@/common/decorators/public.decorator';
import { ApiExcludeController } from '@nestjs/swagger';
import { Response } from 'express';
import { storeFailLine } from '@/observability/store-log';

@ApiExcludeController()
@Controller()
export class AppController {
    constructor(
        private readonly appService: AppService,
        private readonly prisma: PrismaService,
        private readonly logger: Logger,
    ) { }

    readonly SERVICE = AppController.name;

    @Public()
    @Get()
    getHealth() {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            service: 'chariot-payment',
        };
    }

    @Public()
    @Get('ready')
    async getReadiness(@Res({ passthrough: true }) res: Response) {
        let postgres = false;
        try {
            await this.prisma.$queryRaw`SELECT 1`;
            postgres = true;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            this.logger.warn(
                storeFailLine('postgres', 'ready', 'unreachable', message),
                this.SERVICE,
            );
        }

        if (!postgres) {
            res.status(503);
        }

        return {
            status: postgres ? 'ready' : 'not_ready',
            timestamp: new Date().toISOString(),
            service: 'chariot-payment',
            checks: { postgres },
        };
    }
}
