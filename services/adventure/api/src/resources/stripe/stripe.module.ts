import { Module } from '@nestjs/common';
import { StripeService } from '@/resources/stripe/stripe.service';
import { StripeController } from '@/resources/stripe/stripe.controller';
import { UserModule } from '@/resources/user/user.module';
import { MetricsModule } from '@/metrics/metrics.module';

@Module({
  imports: [UserModule, MetricsModule],
  controllers: [StripeController],
  providers: [StripeService],
})
export class StripeModule {}
