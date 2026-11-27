import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Ruleset,
  RulesetDocument,
} from '@/resources/ruleset/schemas/ruleset.schema';
import {
  DEFAULT_GAME_SYSTEM,
  GameSystem,
} from '@/common/constants/game-system.constant';
import { RULESET_SUMMARY_PROJECTION } from '@/resources/ruleset/constants/ruleset.constant';

/**
 * Ruleset referenced by a campaign or a player (`rulesetId`): default on create, validation, and resolution to the
 * published version (an archived version resolves to the published one of the same key).
 * @see FR-game-system — Ruleset reference
 */
@Injectable()
export class RulesetReferenceService {
  constructor(
    @InjectModel(Ruleset.name)
    private readonly rulesetModel: Model<RulesetDocument>,
  ) {}

  /**
   * `rulesetId` to persist on create: the given one when it exists in the same game system (400 otherwise), else the
   * published ruleset of the game system, else `null`.
   */
  async idForCreate(
    gameSystem: GameSystem | undefined,
    rulesetId?: string | Types.ObjectId | null,
  ): Promise<Types.ObjectId | null> {
    const system = gameSystem ?? DEFAULT_GAME_SYSTEM;
    if (rulesetId != null) {
      const id = String(rulesetId);
      const ruleset = Types.ObjectId.isValid(id)
        ? await this.rulesetModel.findById(id).select('gameSystem').exec()
        : null;
      if (!ruleset || ruleset.gameSystem !== system) {
        throw new BadRequestException(
          `Unknown ruleset #${id} for game system ${system}`,
        );
      }
      return new Types.ObjectId(id);
    }
    const published = await this.publishedOfGameSystem(system);
    return published ? (published._id as unknown as Types.ObjectId) : null;
  }

  /**
   * Published ruleset to use for a reference: the referenced version when published, the published version of its
   * key when archived (or draft), else the published ruleset of the game system; `null` when none resolves.
   * Returns the summary (no flow nor catalog): the builder loads the full ruleset by id next.
   */
  async resolvePublished(
    rulesetId: string | null | undefined,
    gameSystem: GameSystem | undefined,
  ): Promise<RulesetDocument | null> {
    if (rulesetId && Types.ObjectId.isValid(rulesetId)) {
      const ruleset = await this.rulesetModel
        .findById(rulesetId)
        .select(RULESET_SUMMARY_PROJECTION)
        .exec();
      if (ruleset?.status === 'published') return ruleset;
      if (ruleset) {
        const current = await this.rulesetModel
          .findOne({ key: ruleset.key, status: 'published' })
          .select(RULESET_SUMMARY_PROJECTION)
          .exec();
        if (current) return current;
      }
    }
    return this.publishedOfGameSystem(gameSystem ?? DEFAULT_GAME_SYSTEM);
  }

  private publishedOfGameSystem(
    gameSystem: GameSystem,
  ): Promise<RulesetDocument | null> {
    return this.rulesetModel
      .findOne({ gameSystem, status: 'published' })
      .select(RULESET_SUMMARY_PROJECTION)
      .sort({ key: 1 })
      .exec();
  }
}
