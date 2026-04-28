import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService
    extends PrismaClient
    implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(PrismaService.name);

    constructor() {
        const connectionString =
            process.env.DATABASE_URL ??
            'postgresql://fake:fake@localhost:5432/fake';

        const adapter = new PrismaPg({ connectionString });

        super({ adapter });
    }

    async onModuleInit() {
        await this.$connect();
        this.logger.verbose('Connected to PostgreSQL');
    }

    async onModuleDestroy() {
        await this.$disconnect();
        this.logger.verbose('Disconnected from PostgreSQL');
    }
}