import { Logger, Controller, Get, Res } from '@nestjs/common';
import { AppService } from '@/app.service';
import { PrismaService } from '@/prisma/prisma.service';
import { RedisService } from '@/redis/redis.service';
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
        private readonly redis: RedisService,
        private readonly logger: Logger,
    ) { }

    readonly SERVICE = AppController.name;

    @Public()
    @Get()
    getHealth() {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            service: 'chariot-session',
        };
    }

    @Public()
    @Get('ready')
    async getReadiness(@Res({ passthrough: true }) res: Response) {
        const checks = { postgres: false, redis: false };

        try {
            await this.prisma.$queryRaw`SELECT 1`;
            checks.postgres = true;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            this.logger.warn(
                storeFailLine('postgres', 'ready', 'unreachable', message),
                this.SERVICE,
            );
        }

        try {
            checks.redis = await this.redis.ping();
            if (!checks.redis) {
                this.logger.warn(
                    storeFailLine('redis', 'ready', 'unreachable'),
                    this.SERVICE,
                );
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            this.logger.warn(
                storeFailLine('redis', 'ready', 'unreachable', message),
                this.SERVICE,
            );
        }

        const ready = Object.values(checks).every(Boolean);
        if (!ready) {
            res.status(503);
        }

        return {
            status: ready ? 'ready' : 'not_ready',
            timestamp: new Date().toISOString(),
            service: 'chariot-session',
            checks,
        };
    }
}
