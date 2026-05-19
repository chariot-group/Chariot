import { Module } from '@nestjs/common';
import { PaymentService } from '@/resources/payment/payment.service';
import { PaymentController } from '@/resources/payment/payment.controller';
import { PromoCodeModule } from '@/resources/promo-code/promo-code.module';
import { AffiliationModule } from '@/resources/affiliation/affiliation.module';

@Module({
    imports: [PromoCodeModule, AffiliationModule],
    controllers: [PaymentController],
    providers: [PaymentService],
    exports: [PaymentService],
})
export class PaymentModule { }
