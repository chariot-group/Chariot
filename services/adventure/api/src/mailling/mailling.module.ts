import { Module } from '@nestjs/common';
import { MaillingService } from '@/mailling/mailling.service';

@Module({
  providers: [MaillingService],
  exports: [MaillingService],
})
export class MaillingModule {}
