import {
    Injectable,
    OnModuleInit,
    OnModuleDestroy,
    Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { storeEventLine, storeFailLine } from '@/observability/store-log';

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
        try {
            await this.$connect();
            this.logger.verbose(storeEventLine('postgres', 'connect'));
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            const stack = error instanceof Error ? error.stack : undefined;
            this.logger.error(
                storeFailLine('postgres', 'connect', 'unreachable', message),
                stack,
            );
            throw error;
        }
    }

    async onModuleDestroy() {
        await this.$disconnect();
        this.logger.verbose(storeEventLine('postgres', 'disconnect'));
    }
}
