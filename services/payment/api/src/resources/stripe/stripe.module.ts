import { Module } from '@nestjs/common';
import { StripeService } from '@/resources/stripe/stripe.service';
import { StripeController } from '@/resources/stripe/stripe.controller';
import { PaymentModule } from '@/resources/payment/payment.module';
import { MetricsModule } from '@/metrics/metrics.module';

@Module({
    imports: [PaymentModule, MetricsModule],
    controllers: [StripeController],
    providers: [StripeService],
})
export class StripeModule { }
