import { Module } from '@nestjs/common';
import { ReferralService } from '@/resources/referral/referral.service';
import { ReferralController } from '@/resources/referral/referral.controller';

@Module({
    controllers: [ReferralController],
    providers: [ReferralService],
    exports: [ReferralService],
})
export class ReferralModule { }
