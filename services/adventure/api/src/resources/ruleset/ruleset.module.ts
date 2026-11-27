import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Ruleset,
  RulesetSchema,
} from '@/resources/ruleset/schemas/ruleset.schema';
import {
  RulesetEntry,
  RulesetEntrySchema,
} from '@/resources/ruleset/schemas/ruleset-entry.schema';
import { RulesetService } from '@/resources/ruleset/ruleset.service';
import { RulesetEntryService } from '@/resources/ruleset/ruleset-entry.service';
import { RulesetController } from '@/resources/ruleset/ruleset.controller';
import { RulesetReferenceService } from '@/resources/ruleset/reference/ruleset-reference.service';

/** @see FR-ruleset-character-builder */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Ruleset.name, schema: RulesetSchema },
      { name: RulesetEntry.name, schema: RulesetEntrySchema },
    ]),
  ],
  controllers: [RulesetController],
  providers: [RulesetService, RulesetEntryService, RulesetReferenceService],
  exports: [RulesetService, RulesetReferenceService, MongooseModule],
})
export class RulesetModule {}
