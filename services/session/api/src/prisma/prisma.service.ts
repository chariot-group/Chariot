import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(PrismaService.name);
    private readonly SERVICE_NAME = PrismaService.name;

    constructor() {
        const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
        super({ adapter });
    }

    async onModuleInit() {
        await this.$connect();
        this.logger.verbose('Connected to PostgreSQL', this.SERVICE_NAME);
    }

    async onModuleDestroy() {
        await this.$disconnect();
        this.logger.verbose('Disconnected from PostgreSQL', this.SERVICE_NAME);
    }
}
