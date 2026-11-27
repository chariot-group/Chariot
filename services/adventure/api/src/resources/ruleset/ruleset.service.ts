import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Ruleset,
  RulesetDocument,
} from '@/resources/ruleset/schemas/ruleset.schema';
import {
  RulesetEntry,
  RulesetEntryDocument,
} from '@/resources/ruleset/schemas/ruleset-entry.schema';
import { CreateRulesetDto } from '@/resources/ruleset/dto/create-ruleset.dto';
import { UpdateRulesetDto } from '@/resources/ruleset/dto/update-ruleset.dto';
import { FindRulesetsQueryDto } from '@/resources/ruleset/dto/find-rulesets-query.dto';
import {
  validateEntryIntegrity,
  validateRulesetIntegrity,
} from '@/resources/ruleset/validation/ruleset-integrity';
import {
  assertNoIntegrityErrors,
  toHttpError,
} from '@/resources/ruleset/ruleset.errors';
import { IResponse } from '@/common/dtos/reponse.dto';
import { RULESET_SUMMARY_PROJECTION } from '@/resources/ruleset/constants/ruleset.constant';

/** Fields copied when a new version is created from an existing one. */
const RULESET_CONTENT_FIELDS = [
  'key',
  'gameSystem',
  'name',
  'description',
  'flow',
  'formulas',
  'projection',
  'data',
  'levels',
  'attachments',
  'counters',
  'collections',
] as const;

const ENTRY_CONTENT_FIELDS = [
  'type',
  'key',
  'parentKey',
  'label',
  'description',
  'level',
  'tags',
  'data',
  'effects',
  'grants',
  'values',
] as const;

/** Plain copy of the given fields of a document (no _id, timestamps or status). */
function pick<T, K extends keyof T>(
  document: { toObject: () => T },
  keys: readonly K[],
): Pick<T, K> {
  const plain = document.toObject();
  return Object.fromEntries(keys.map((k) => [k, plain[k]])) as Pick<T, K>;
}

/** @see FR-ruleset-character-builder */
@Injectable()
export class RulesetService {
  constructor(
    @InjectModel(Ruleset.name)
    private readonly rulesetModel: Model<RulesetDocument>,
    @InjectModel(RulesetEntry.name)
    private readonly entryModel: Model<RulesetEntryDocument>,
  ) {}

  private readonly logger = new Logger(RulesetService.name);

  // ── Read ──────────────────────────────────────────────────────────────────

  async findAll(
    query: FindRulesetsQueryDto,
    isAdmin: boolean,
  ): Promise<IResponse<Ruleset[]>> {
    try {
      const filter: Record<string, unknown> = {};
      if (!isAdmin) filter.status = 'published';
      if (query.gameSystem) filter.gameSystem = query.gameSystem;

      const rulesets = await this.rulesetModel
        .find(filter)
        .select(RULESET_SUMMARY_PROJECTION)
        .sort({ key: 1, version: -1 })
        .exec();

      return { message: 'Rulesets found', data: rulesets };
    } catch (error) {
      throw toHttpError(error, 'Error fetching rulesets', this.logger);
    }
  }

  async findPublishedByKey(key: string): Promise<IResponse<Ruleset>> {
    try {
      const ruleset = await this.rulesetModel
        .findOne({ key, status: 'published' })
        .exec();
      if (!ruleset) {
        throw new NotFoundException(`No published ruleset for key "${key}"`);
      }
      return { message: `Ruleset "${key}" found`, data: ruleset };
    } catch (error) {
      throw toHttpError(error, `Error fetching ruleset "${key}"`, this.logger);
    }
  }

  async findById(
    id: Types.ObjectId,
    isAdmin: boolean,
  ): Promise<IResponse<Ruleset>> {
    try {
      const ruleset = await this.getVisibleOrFail(id, isAdmin);
      return { message: `Ruleset #${id} found`, data: ruleset };
    } catch (error) {
      throw toHttpError(error, `Error fetching ruleset #${id}`, this.logger);
    }
  }

  /** Non-admin users only see published rulesets; other statuses answer 404. */
  async getVisibleOrFail(
    id: Types.ObjectId,
    isAdmin: boolean,
  ): Promise<RulesetDocument> {
    const ruleset = await this.rulesetModel.findById(id).exec();
    if (!ruleset || (!isAdmin && ruleset.status !== 'published')) {
      throw new NotFoundException(`Ruleset #${id} not found`);
    }
    return ruleset;
  }

  /** Published and archived rulesets are immutable. */
  async getDraftOrFail(id: Types.ObjectId): Promise<RulesetDocument> {
    const ruleset = await this.rulesetModel.findById(id).exec();
    if (!ruleset) throw new NotFoundException(`Ruleset #${id} not found`);
    if (ruleset.status !== 'draft') {
      throw new ConflictException(
        `Ruleset #${id} is ${ruleset.status} and cannot be modified; create a new version`,
      );
    }
    return ruleset;
  }

  // ── Admin write ───────────────────────────────────────────────────────────

  async create(
    dto: CreateRulesetDto,
    userId: string,
  ): Promise<IResponse<Ruleset>> {
    try {
      const exists = await this.rulesetModel.exists({ key: dto.key });
      if (exists) {
        throw new ConflictException(
          `Ruleset key "${dto.key}" already exists; create a new version instead`,
        );
      }
      assertNoIntegrityErrors(validateRulesetIntegrity(dto));

      const ruleset = await this.rulesetModel.create({
        ...dto,
        version: 1,
        status: 'draft',
        createdBy: userId,
      });

      this.logger.log(`Ruleset "${dto.key}" v1 created by ${userId}`);
      return { message: 'Ruleset created', data: ruleset };
    } catch (error) {
      throw toHttpError(error, 'Error creating ruleset', this.logger);
    }
  }

  async update(
    id: Types.ObjectId,
    dto: UpdateRulesetDto,
  ): Promise<IResponse<Ruleset>> {
    try {
      const ruleset = await this.getDraftOrFail(id);
      const merged = { ...ruleset.toObject(), ...dto };
      assertNoIntegrityErrors(validateRulesetIntegrity(merged));

      ruleset.set(dto);
      await ruleset.save();

      return { message: `Ruleset #${id} updated`, data: ruleset };
    } catch (error) {
      throw toHttpError(error, `Error updating ruleset #${id}`, this.logger);
    }
  }

  async remove(id: Types.ObjectId): Promise<IResponse<Ruleset>> {
    try {
      const ruleset = await this.getDraftOrFail(id);
      await this.entryModel.deleteMany({ rulesetId: ruleset._id }).exec();
      await ruleset.deleteOne();

      this.logger.log(`Draft ruleset #${id} deleted`);
      return { message: `Ruleset #${id} deleted`, data: ruleset };
    } catch (error) {
      throw toHttpError(error, `Error deleting ruleset #${id}`, this.logger);
    }
  }

  /**
   * Publishes a draft after a full integrity check (ruleset + entries).
   * The currently published version of the same key, if any, is archived.
   */
  async publish(id: Types.ObjectId): Promise<IResponse<Ruleset>> {
    try {
      const ruleset = await this.getDraftOrFail(id);
      const entries = await this.entryModel
        .find({ rulesetId: ruleset._id })
        .exec();
      assertNoIntegrityErrors(this.collectPublishErrors(ruleset, entries));

      await this.rulesetModel
        .updateMany(
          { key: ruleset.key, status: 'published' },
          { $set: { status: 'archived' } },
        )
        .exec();

      ruleset.status = 'published';
      ruleset.publishedAt = new Date();
      await ruleset.save();

      this.logger.log(`Ruleset "${ruleset.key}" v${ruleset.version} published`);
      return { message: `Ruleset #${id} published`, data: ruleset };
    } catch (error) {
      throw toHttpError(error, `Error publishing ruleset #${id}`, this.logger);
    }
  }

  async archive(id: Types.ObjectId): Promise<IResponse<Ruleset>> {
    try {
      const ruleset = await this.rulesetModel.findById(id).exec();
      if (!ruleset) throw new NotFoundException(`Ruleset #${id} not found`);
      if (ruleset.status !== 'published') {
        throw new ConflictException(
          `Only a published ruleset can be archived (#${id} is ${ruleset.status})`,
        );
      }
      ruleset.status = 'archived';
      await ruleset.save();
      return { message: `Ruleset #${id} archived`, data: ruleset };
    } catch (error) {
      throw toHttpError(error, `Error archiving ruleset #${id}`, this.logger);
    }
  }

  /** Copies a ruleset and its entries into a new draft with the next version number. */
  async createVersion(
    id: Types.ObjectId,
    userId: string,
  ): Promise<IResponse<Ruleset>> {
    try {
      const source = await this.rulesetModel.findById(id).exec();
      if (!source) throw new NotFoundException(`Ruleset #${id} not found`);

      const latest = await this.rulesetModel
        .findOne({ key: source.key })
        .sort({ version: -1 })
        .select('version')
        .exec();

      const draft = await this.rulesetModel.create({
        ...pick(source, RULESET_CONTENT_FIELDS),
        version: (latest?.version ?? source.version) + 1,
        status: 'draft',
        createdBy: userId,
      });

      const entries = await this.entryModel
        .find({ rulesetId: source._id })
        .exec();
      if (entries.length > 0) {
        await this.entryModel.insertMany(
          entries.map((entry) => ({
            ...pick(entry, ENTRY_CONTENT_FIELDS),
            rulesetId: draft._id,
            createdBy: userId,
          })),
        );
      }

      this.logger.log(
        `Ruleset "${draft.key}" v${draft.version} drafted from #${id} by ${userId}`,
      );
      return {
        message: `Ruleset version ${draft.version} created`,
        data: draft,
      };
    } catch (error) {
      throw toHttpError(
        error,
        `Error creating a new version of ruleset #${id}`,
        this.logger,
      );
    }
  }

  private collectPublishErrors(
    ruleset: RulesetDocument,
    entries: RulesetEntryDocument[],
  ): string[] {
    const plain = ruleset.toObject();
    const errors = validateRulesetIntegrity(plain);
    const keys = new Set(entries.map((e) => e.key));

    entries.forEach((entry) => {
      const prefix = `entries[${entry.type}/${entry.key}]`;
      if (entry.parentKey && !keys.has(entry.parentKey)) {
        errors.push(
          `${prefix}.parentKey references unknown entry "${entry.parentKey}"`,
        );
      }
      validateEntryIntegrity(entry.toObject(), plain).forEach((e) =>
        errors.push(`${prefix}.${e}`),
      );
    });

    return errors;
  }
}
