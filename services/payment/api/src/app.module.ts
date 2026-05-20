import { Logger, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '@/prisma/prisma.module';
import { MetricsModule } from '@/metrics/metrics.module';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { KeycloakAuthGuard } from '@/common/guards/keycloak-auth.guard';
import { PromoCodeModule } from '@/resources/promo-code/promo-code.module';
import { AffiliationModule } from '@/resources/affiliation/affiliation.module';
import { PaymentModule } from '@/resources/payment/payment.module';
import { AnalyticsModule } from '@/resources/analytics/analytics.module';
import { StripeModule } from '@/resources/stripe/stripe.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            cache: true,
        }),
        PrismaModule,
        MetricsModule,
        PrometheusModule.register(),
        PromoCodeModule,
        AffiliationModule,
        PaymentModule,
        AnalyticsModule,
        StripeModule,
    ],
    controllers: [AppController],
    providers: [
        AppService,
        Logger,
        {
            provide: APP_GUARD,
            useClass: KeycloakAuthGuard,
        },
    ],
})
export class AppModule { }
