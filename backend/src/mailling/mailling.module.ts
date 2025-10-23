import { Module } from '@nestjs/common';
import { MaillingService } from '@/mailling/mailling.service';
import { MetricsModule } from '@/metrics/metrics.module';

@Module({
  imports: [MetricsModule],
  providers: [MaillingService],
  exports: [MaillingService],
})
export class MaillingModule { }
