import { Module } from '@nestjs/common';
import { AffiliationService } from '@/resources/affiliation/affiliation.service';
import { AffiliationController } from '@/resources/affiliation/affiliation.controller';

@Module({
    controllers: [AffiliationController],
    providers: [AffiliationService],
    exports: [AffiliationService],
})
export class AffiliationModule { }
