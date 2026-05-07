import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SessionAccessService } from '@/common/session/session-access.service';

@Module({
  imports: [ConfigModule],
  providers: [SessionAccessService],
  exports: [SessionAccessService],
})
export class SessionAccessModule {}
