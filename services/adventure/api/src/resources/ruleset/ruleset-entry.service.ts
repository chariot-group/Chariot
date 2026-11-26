import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  RulesetEntry,
  RulesetEntryDocument,
} from '@/resources/ruleset/schemas/ruleset-entry.schema';
import {
  CreateRulesetEntryDto,
  FindRulesetEntriesQueryDto,
  UpdateRulesetEntryDto,
} from '@/resources/ruleset/dto/ruleset-entry.dto';
import { RulesetService } from '@/resources/ruleset/ruleset.service';
import { validateEntryIntegrity } from '@/resources/ruleset/validation/ruleset-integrity';
import {
  assertNoIntegrityErrors,
  toHttpError,
} from '@/resources/ruleset/ruleset.errors';
import { IPaginatedResponse, IResponse } from '@/common/dtos/reponse.dto';

/** @see FR-ruleset-character-builder — ruleset_entries */
@Injectable()
export class RulesetEntryService {
  constructor(
    @InjectModel(RulesetEntry.name)
    private readonly entryModel: Model<RulesetEntryDocument>,
    private readonly rulesetService: RulesetService,
  ) {}

  private readonly logger = new Logger(RulesetEntryService.name);

  async findAll(
    rulesetId: Types.ObjectId,
    query: FindRulesetEntriesQueryDto,
    isAdmin: boolean,
  ): Promise<IPaginatedResponse<RulesetEntry[]>> {
    try {
      await this.rulesetService.getVisibleOrFail(rulesetId, isAdmin);

      const filter: Record<string, unknown> = { rulesetId };
      if (query.type) filter.type = query.type;
      if (query.parentKey) filter.parentKey = query.parentKey;
      if (query.level !== undefined) filter.level = query.level;
      if (query.tags?.length) filter.tags = { $all: query.tags };

      const page = query.page ?? 1;
      const offset = query.offset ?? 10;

      const [entries, totalItems] = await Promise.all([
        this.entryModel
          .find(filter)
          .sort({ type: 1, level: 1, key: 1 })
          .skip((page - 1) * offset)
          .limit(offset)
          .exec(),
        this.entryModel.countDocuments(filter).exec(),
      ]);

      return {
        message: 'Ruleset entries found',
        data: entries,
        pagination: { page, offset, totalItems },
      };
    } catch (error) {
      throw toHttpError(
        error,
        `Error fetching entries of ruleset #${rulesetId}`,
        this.logger,
      );
    }
  }

  async create(
    rulesetId: Types.ObjectId,
    dto: CreateRulesetEntryDto,
    userId: string,
  ): Promise<IResponse<RulesetEntry>> {
    try {
      const ruleset = await this.rulesetService.getDraftOrFail(rulesetId);
      await this.assertParentExists(rulesetId, dto.parentKey);
      assertNoIntegrityErrors(validateEntryIntegrity(dto, ruleset.toObject()));

      const entry = await this.entryModel.create({
        ...dto,
        rulesetId,
        createdBy: userId,
      });

      return { message: 'Ruleset entry created', data: entry };
    } catch (error) {
      throw toHttpError(error, 'Error creating ruleset entry', this.logger);
    }
  }

  async update(
    rulesetId: Types.ObjectId,
    entryId: Types.ObjectId,
    dto: UpdateRulesetEntryDto,
  ): Promise<IResponse<RulesetEntry>> {
    try {
      const ruleset = await this.rulesetService.getDraftOrFail(rulesetId);
      const entry = await this.getEntryOrFail(rulesetId, entryId);

      if (dto.parentKey !== undefined && dto.parentKey === entry.key) {
        throw new ConflictException('An entry cannot be its own parent');
      }
      await this.assertParentExists(rulesetId, dto.parentKey);
      assertNoIntegrityErrors(
        validateEntryIntegrity(
          { ...entry.toObject(), ...dto },
          ruleset.toObject(),
        ),
      );

      entry.set(dto);
      await entry.save();

      return { message: `Ruleset entry #${entryId} updated`, data: entry };
    } catch (error) {
      throw toHttpError(
        error,
        `Error updating ruleset entry #${entryId}`,
        this.logger,
      );
    }
  }

  async remove(
    rulesetId: Types.ObjectId,
    entryId: Types.ObjectId,
  ): Promise<IResponse<RulesetEntry>> {
    try {
      await this.rulesetService.getDraftOrFail(rulesetId);
      const entry = await this.getEntryOrFail(rulesetId, entryId);

      const hasChildren = await this.entryModel.exists({
        rulesetId,
        parentKey: entry.key,
      });
      if (hasChildren) {
        throw new ConflictException(
          `Entry "${entry.key}" is the parent of other entries`,
        );
      }

      await entry.deleteOne();
      return { message: `Ruleset entry #${entryId} deleted`, data: entry };
    } catch (error) {
      throw toHttpError(
        error,
        `Error deleting ruleset entry #${entryId}`,
        this.logger,
      );
    }
  }

  private async getEntryOrFail(
    rulesetId: Types.ObjectId,
    entryId: Types.ObjectId,
  ): Promise<RulesetEntryDocument> {
    const entry = await this.entryModel
      .findOne({ _id: entryId, rulesetId })
      .exec();
    if (!entry) {
      throw new NotFoundException(`Ruleset entry #${entryId} not found`);
    }
    return entry;
  }

  /** parentKey must match an entry key of the same ruleset. */
  private async assertParentExists(
    rulesetId: Types.ObjectId,
    parentKey?: string,
  ): Promise<void> {
    if (!parentKey) return;
    const parent = await this.entryModel.exists({ rulesetId, key: parentKey });
    if (!parent) {
      throw new BadRequestException([
        `parentKey references unknown entry "${parentKey}"`,
      ]);
    }
  }
}
