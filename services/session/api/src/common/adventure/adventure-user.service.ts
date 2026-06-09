import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';

@Injectable()
export class AdventureUserService {
    private readonly logger = new Logger(AdventureUserService.name);
    private readonly SERVICE_NAME = AdventureUserService.name;

    async getBalance(userId: string): Promise<number> {
        const adventureUrl = process.env.ADVENTURE_SERVICE_URL;
        const internalSecret = process.env.INTERNAL_SERVICE_SECRET;

        if (!adventureUrl || !internalSecret) {
            const message = 'ADVENTURE_SERVICE_URL or INTERNAL_SERVICE_SECRET is not configured';
            this.logger.error(message, null, this.SERVICE_NAME);
            throw new InternalServerErrorException(message);
        }

        const url = `${adventureUrl.replace(/\/$/, '')}/user/internal/${encodeURIComponent(userId)}/balance`;

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: { 'x-internal-service-secret': internalSecret },
                signal: AbortSignal.timeout(5_000),
            });

            if (response.status === 404) {
                throw new NotFoundException(`User #${userId} not found`);
            }

            if (!response.ok) {
                const message = `Failed to fetch balance for user ${userId}: HTTP ${response.status}`;
                this.logger.error(message, null, this.SERVICE_NAME);
                throw new InternalServerErrorException(message);
            }

            const body = (await response.json()) as { balance?: number };
            if (typeof body.balance !== 'number' || Number.isNaN(body.balance)) {
                throw new InternalServerErrorException(`Invalid balance payload for user ${userId}`);
            }

            return body.balance;
        } catch (error: any) {
            if (error instanceof NotFoundException || error instanceof InternalServerErrorException) {
                throw error;
            }
            const message = `Failed to fetch balance for user ${userId}: ${error.message}`;
            this.logger.error(message, null, this.SERVICE_NAME);
            throw new InternalServerErrorException(message);
        }
    }
}
