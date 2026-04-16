import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { Logger } from '@nestjs/common';

describe('AppController', () => {
    let appController: AppController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [AppController],
            providers: [AppService, Logger],
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
});
