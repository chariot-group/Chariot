import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { RulesetModule } from '@/resources/ruleset/ruleset.module';
import { RulesetImportService } from '@/seeder/rulesets/ruleset-import.service';

/** Minimal context for the import command: Mongo + ruleset models only. */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.getOrThrow<string>('CHARIOT_MONGO_URL'),
      }),
    }),
    RulesetModule,
  ],
  providers: [RulesetImportService],
})
export class RulesetImportModule {}
