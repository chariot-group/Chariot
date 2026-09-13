import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { PrismaService } from '@/prisma/prisma.service';
import { RedisService } from '@/redis/redis.service';
import { Logger } from '@nestjs/common';

describe('AppController', () => {
    let appController: AppController;
    let prisma: { $queryRaw: jest.Mock };
    let redis: { ping: jest.Mock };
    let res: { status: jest.Mock };

    beforeEach(async () => {
        prisma = { $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]) };
        redis = { ping: jest.fn().mockResolvedValue(true) };
        res = { status: jest.fn() };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [AppController],
            providers: [
                AppService,
                Logger,
                { provide: PrismaService, useValue: prisma },
                { provide: RedisService, useValue: redis },
            ],
        }).compile();

        appController = module.get<AppController>(AppController);
    });

    describe('getHealth', () => {
        it('should return health status', () => {
            const result = appController.getHealth();
            expect(result.status).toBe('ok');
            expect(result.service).toBe('chariot-session');
            expect(result.timestamp).toBeDefined();
        });
    });

    describe('getReadiness', () => {
        it('should return ready when postgres and redis answer', async () => {
            const result = await appController.getReadiness(res as never);

            expect(result.status).toBe('ready');
            expect(result.checks).toEqual({ postgres: true, redis: true });
            expect(res.status).not.toHaveBeenCalled();
        });

        it('should return 503 when a dependency is down', async () => {
            redis.ping.mockResolvedValue(false);

            const result = await appController.getReadiness(res as never);

            expect(result.status).toBe('not_ready');
            expect(result.checks.redis).toBe(false);
            expect(res.status).toHaveBeenCalledWith(503);
        });
    });
});
