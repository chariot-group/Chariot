import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { storeEventLine, storeFailLine } from '@/observability/store-log';

@Injectable()
export class MongoConnectionLogger implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MongoConnectionLogger.name);

  constructor(@InjectConnection() private readonly connection: Connection) {}

  onModuleInit(): void {
    this.connection.on('connected', this.onConnected);
    this.connection.on('disconnected', this.onDisconnected);
    this.connection.on('error', this.onError);
    if (this.connection.readyState === 1) {
      this.onConnected();
    }
  }

  onModuleDestroy(): void {
    this.connection.off('connected', this.onConnected);
    this.connection.off('disconnected', this.onDisconnected);
    this.connection.off('error', this.onError);
  }

  private onConnected = (): void => {
    this.logger.verbose(storeEventLine('mongo', 'connect'));
  };

  private onDisconnected = (): void => {
    this.logger.verbose(storeEventLine('mongo', 'disconnect'));
  };

  private onError = (error: Error): void => {
    this.logger.error(
      storeFailLine('mongo', 'client', 'driver', error.message),
      error.stack,
    );
  };
}
