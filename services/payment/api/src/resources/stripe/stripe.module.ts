import { Module } from '@nestjs/common';
import { StripeService } from '@/resources/stripe/stripe.service';
import { StripeController } from '@/resources/stripe/stripe.controller';
import { PaymentModule } from '@/resources/payment/payment.module';
import { MetricsModule } from '@/metrics/metrics.module';
import { PromoCodeModule } from '@/resources/promo-code/promo-code.module';
import { AffiliationModule } from '@/resources/affiliation/affiliation.module';

@Module({
    imports: [PaymentModule, MetricsModule, PromoCodeModule, AffiliationModule],
    controllers: [StripeController],
    providers: [StripeService],
})
export class StripeModule { }
