import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Ruleset,
  RulesetDocument,
} from '@/resources/ruleset/schemas/ruleset.schema';
import {
  RulesetEntry,
  RulesetEntryDocument,
} from '@/resources/ruleset/schemas/ruleset-entry.schema';
import { RulesetService } from '@/resources/ruleset/ruleset.service';
import {
  RulesetSeed,
  rulesetContent,
  seedContentHash,
  validateSeed,
} from '@/seeder/rulesets/ruleset-seed.loader';

/** Keycloak-shaped id used as `createdBy` for imported data. */
export const SEED_IMPORT_USER_ID = '00000000-0000-4000-8000-000000000000';

export type ImportStatus = 'created' | 'unchanged' | 'validated';

export type ImportResult = {
  key: string;
  version: number;
  status: ImportStatus;
  entries: number;
};

export class SeedValidationError extends Error {
  constructor(
    readonly key: string,
    readonly errors: string[],
  ) {
    super(
      `Seed "${key}" is invalid (${errors.length} error(s)):\n- ${errors.slice(0, 20).join('\n- ')}`,
    );
  }
}

/** @see FR-ruleset-character-builder — Seed import */
@Injectable()
export class RulesetImportService {
  constructor(
    @InjectModel(Ruleset.name)
    private readonly rulesetModel: Model<RulesetDocument>,
    @InjectModel(RulesetEntry.name)
    private readonly entryModel: Model<RulesetEntryDocument>,
    private readonly rulesetService: RulesetService,
  ) {}

  private readonly logger = new Logger(RulesetImportService.name);

  async importSeed(
    seed: RulesetSeed,
    options: { dryRun?: boolean } = {},
  ): Promise<ImportResult> {
    const { key, version } = seed.ruleset;
    const base = { key, version, entries: seed.entries.length };

    const errors = validateSeed(seed);
    if (errors.length > 0) throw new SeedValidationError(key, errors);

    const contentHash = seedContentHash(seed);
    const existing = await this.rulesetModel.findOne({ key, version }).exec();
    if (existing) {
      if (existing.contentHash === contentHash) {
        return { ...base, status: 'unchanged' };
      }
      throw new ConflictException(
        `Ruleset "${key}" v${version} already exists with a different content: raise "version" in the seed (a published version is never modified)`,
      );
    }

    const newer = await this.rulesetModel
      .findOne({ key, version: { $gt: version } })
      .select('version')
      .exec();
    if (newer) {
      throw new ConflictException(
        `Ruleset "${key}" v${newer.version} is newer than the seed v${version}: import refused`,
      );
    }

    if (options.dryRun) return { ...base, status: 'validated' };

    // The seed passed the DTO validation above: its plain JSON matches the schema.
    const content = rulesetContent(seed.ruleset) as unknown as Partial<Ruleset>;
    const draft = await this.rulesetModel.create({
      ...content,
      version,
      status: 'draft',
      contentHash,
      createdBy: SEED_IMPORT_USER_ID,
    });

    try {
      await this.entryModel.insertMany(
        seed.entries.map((entry) => ({
          ...entry,
          rulesetId: draft._id,
          createdBy: SEED_IMPORT_USER_ID,
        })),
      );
      await this.rulesetService.publish(draft._id);
    } catch (error) {
      this.logger.error(
        `Import of "${key}" v${version} failed, removing the draft: ${(error as Error).message}`,
      );
      await this.entryModel.deleteMany({ rulesetId: draft._id }).exec();
      await this.rulesetModel.deleteOne({ _id: draft._id }).exec();
      throw error;
    }

    return { ...base, status: 'created' };
  }
}
