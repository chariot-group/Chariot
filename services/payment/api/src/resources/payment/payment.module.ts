import { Module } from '@nestjs/common';
import { PaymentService } from '@/resources/payment/payment.service';
import { PaymentController } from '@/resources/payment/payment.controller';
import { PromoCodeModule } from '@/resources/promo-code/promo-code.module';
import { AffiliationModule } from '@/resources/affiliation/affiliation.module';
import { InternalGuard } from '@/common/guards/internal.guard';
import { KeycloakAdminService } from '@/common/services/keycloak-admin.service';

@Module({
    imports: [PromoCodeModule, AffiliationModule],
    controllers: [PaymentController],
    providers: [PaymentService, InternalGuard, KeycloakAdminService],
    exports: [PaymentService],
})
export class PaymentModule { }
