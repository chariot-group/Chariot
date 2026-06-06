import { Module } from '@nestjs/common';
import { PromoCodeService } from '@/resources/promo-code/promo-code.service';
import { PromoCodeController } from '@/resources/promo-code/promo-code.controller';

@Module({
    controllers: [PromoCodeController],
    providers: [PromoCodeService],
    exports: [PromoCodeService],
})
export class PromoCodeModule { }
