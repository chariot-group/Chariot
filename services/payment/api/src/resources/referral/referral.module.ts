import { Module } from '@nestjs/common';
import { ReferralService } from '@/resources/referral/referral.service';
import { ReferralController } from '@/resources/referral/referral.controller';
import { KeycloakAdminService } from '@/common/services/keycloak-admin.service';

@Module({
    controllers: [ReferralController],
    providers: [ReferralService, KeycloakAdminService],
    exports: [ReferralService],
})
export class ReferralModule { }
