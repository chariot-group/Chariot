import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Group } from '@/resources/group/schemas/group.schema';
import { SortOrder } from 'mongoose';
import { GroupDocument } from '@/resources/group/schemas/group.schema';
import { CreateGroupDto } from '@/resources/group/dto/create-group.dto';
import { UpdateGroupDto } from '@/resources/group/dto/update-group.dto';
import { Model, Types } from 'mongoose';
import {
  Campaign,
  CampaignDocument,
} from '@/resources/campaign/schemas/campaign.schema';
import {
  Character,
  CharacterDocument,
} from '@/resources/character/core/schemas/character.schema';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter } from 'prom-client';
import { IPaginatedResponse, IResponse } from '@/common/dtos/reponse.dto';

@Injectable()
export class GroupService {
  constructor(
    @InjectModel(Group.name) private groupModel: Model<GroupDocument>,
    @InjectModel(Campaign.name) private campaignModel: Model<CampaignDocument>,
    @InjectModel(Character.name)
    private characterModel: Model<CharacterDocument>,
    @InjectMetric('chariot_groups_created_total')
    private readonly groupsCreatedCounter: Counter,
  ) { }

  private readonly SERVICE_NAME = GroupService.name;
  private readonly logger = new Logger(this.SERVICE_NAME);

  async create(
    createGroupDto: CreateGroupDto,
    userId: string,
  ): Promise<IResponse<Group>> {
    try {
      const { characters = [], campaigns, ...groupData } = createGroupDto;

      const start: number = Date.now();
      const group: Group = await this.groupModel.create({
        ...groupData,
        characters,
        campaigns: campaigns.map((campaign) => campaign.idCampaign),
        createdBy: userId,
      });

      await this.characterModel.updateMany(
        { _id: { $in: characters.map((id) => id) } },
        { $addToSet: { groups: group._id } },
      );
      campaigns.forEach(async (campaign) => {
        const type = campaign.type;
        const campaignId = campaign.idCampaign;
        await this.campaignModel.updateMany(
          { _id: campaignId },
          { $addToSet: { [`groups.${type}`]: group._id } },
        );
      });

      // Incrémentation du compteur Prometheus
      this.groupsCreatedCounter.inc({
        campaign_id: campaigns.length > 0 ? campaigns[0].idCampaign : 'none',
      });

      const end: number = Date.now();

      const message: string = `Group created in ${end - start}ms`;
      this.logger.verbose(message, this.SERVICE_NAME);
      return {
        message,
        data: group,
      };
    } catch (error) {
      const errorMessage: string = `Error while creating group: ${error.message}`;
      this.logger.error(errorMessage, null, this.SERVICE_NAME);
      throw new InternalServerErrorException(errorMessage);
    }
  }

  async findAllByUser(
    userId: string,
    query: {
      page?: number;
      offset?: number;
      label?: string;
      sort?: string;
      onlyWithMembers?: unknown;
    },
    campaignId?: string,
    type: 'all' | 'active' | 'archived' = 'all',
  ): Promise<IPaginatedResponse<Group[]>> {
    try {
      const {
        label = '',
        page = 1,
        offset = 10,
        sort = 'updatedAt',
        onlyWithMembers = false,
      } = query;

      let sortCriteria: { [key: string]: SortOrder } = { updatedAt: 'asc' };
      if (sort) {
        if (sort.startsWith('-')) {
          sortCriteria[sort.substring(1)] = 'desc';
        } else {
          sortCriteria[sort] = 'asc';
        }
      }

      const filters: Record<string, unknown> = {
        label: { $regex: `${decodeURIComponent(label)}`, $options: 'i' },
        deletedAt: { $eq: null },
        createdBy: userId,
      };

      if (onlyWithMembers == 'true') {
        filters.characters = { $ne: [] };
      }

      if (campaignId) {
        const campaign = await this.campaignModel.findById(campaignId).lean();
        if (!campaign) {
          const message: string = `Error while fetching groups: Campaign #${campaignId} not found`;
          this.logger.error(message, null, this.SERVICE_NAME);
          throw new NotFoundException(message);
        }

        let groupIds: string[] = [];
        if (type === 'all') {
          groupIds = [
            ...(campaign.groups?.active || []).map((group: unknown) =>
              group.toString(),
            ),
            ...(campaign.groups?.archived || []).map((group: unknown) =>
              group.toString(),
            ),
          ];
        } else {
          groupIds = (campaign.groups?.[type] || []).map((group: unknown) =>
            group.toString(),
          );
        }

        filters['campaigns'] = { $in: [campaignId] };
        filters['_id'] = { $in: groupIds };
      }

      const start: number = Date.now();
      const groups: Group[] = await this.groupModel
        .find(filters)
        .sort({ ...sortCriteria, _id: 'asc' })
        .limit(offset)
        .skip((page - 1) * offset)
        .populate({
          path: 'characters',
          match: { deletedAt: null },
          select: '_id firstname lastname surname createdBy challenge profile progression',
        })
        .exec();

      const totalItems: number = await this.groupModel.countDocuments(filters);
      const end: number = Date.now();

      const message: string = `Groups found in ${end - start}ms`;
      this.logger.verbose(message);

      return {
        message: message,
        data: groups,
        pagination: {
          page: page,
          offset: offset,
          totalItems: totalItems,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      const errorMessage: string = `Error while fetching groups: ${error.message}`;
      this.logger.error(errorMessage);
      throw new InternalServerErrorException(errorMessage);
    }
  }

  async findOne(id: Types.ObjectId) {
    try {
      const start: number = Date.now();
      const group = await this.groupModel
        .findById(id)
        .populate('characters')
        .populate('campaigns')
        .exec();
      const end: number = Date.now();

      const message = `Group #${id} found in ${end - start}ms`;
      this.logger.verbose(message, this.SERVICE_NAME);
      return {
        message,
        data: group,
      };
    } catch (error) {
      const message = `Error while fetching group #${id}: ${error.message}`;
      this.logger.error(message, null, this.SERVICE_NAME);
      throw new InternalServerErrorException(message);
    }
  }

  async update(id: Types.ObjectId, updateGroupDto: UpdateGroupDto) {
    try {
      let { characters, campaigns, ...groupData } = updateGroupDto;

      let group = await this.groupModel
        .findById(id)
        .populate('campaigns')
        .exec();

      let campaignIds = group.campaigns.map((campaign) =>
        campaign._id.toString(),
      );
      if (campaigns) {
        campaignIds = campaigns.map((campaign) => campaign.idCampaign);
      }

      let charactersToRemove = [];
      if (characters) {
        charactersToRemove = group.characters.filter(
          (oldCharacter) =>
            !characters.some(
              (newCharacters) => newCharacters === oldCharacter._id.toString(),
            ),
        );
      }

      const start: number = Date.now();
      const groupUpdate = await this.groupModel
        .updateOne(
          { _id: id },
          {
            ...groupData,
            characters,
            campaigns: campaignIds,
          },
        )
        .exec();
      group = await this.groupModel
        .findById(id)
        .populate('campaigns')
        .populate('characters')
        .exec();

      if (characters) {
        await this.characterModel.updateMany(
          { _id: { $in: characters.map((id) => id) } },
          { $addToSet: { groups: id } },
        );
        await this.characterModel.updateMany(
          { _id: { $in: charactersToRemove } },
          { $pull: { groups: id } },
        );
      }

      if (campaigns) {
        campaigns.forEach(async (newCampaign) => {
          ['main', 'npc', 'archived'].forEach(async (type) => {
            const campaignId = newCampaign.idCampaign;
            await this.campaignModel.updateMany(
              { _id: campaignId },
              { $pull: { [`groups.${type}`]: id } },
            );
          });
        });

        campaigns.forEach(async (campaign) => {
          const type = campaign.type;
          const campaignId = campaign.idCampaign;
          await this.campaignModel.updateMany(
            { _id: campaignId },
            { $addToSet: { [`groups.${type}`]: id } },
          );
        });
      }

      const end: number = Date.now();

      if (groupUpdate.modifiedCount === 0) {
        const message = `Group #${id} not found`;
        this.logger.error(message, null, this.SERVICE_NAME);
        throw new NotFoundException(message);
      }

      const message = `Group #${id} update in ${end - start}ms`;
      this.logger.verbose(message, this.SERVICE_NAME);
      return {
        message,
        data: group,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      const message = `Error while updating group #${id}: ${error.message}`;
      this.logger.error(message, null, this.SERVICE_NAME);
      throw new InternalServerErrorException(message);
    }
  }

  async remove(id: Types.ObjectId) {
    try {
      const group = await this.groupModel.findById(id).exec();

      const start: number = Date.now();
      const deletionDate = new Date();
      group.deletedAt = deletionDate;

      const rawCharacterIds = (group.characters || []).map((character) => {
        const maybeCharacter = character as { _id?: unknown };
        if (
          typeof maybeCharacter === 'object' &&
          maybeCharacter !== null &&
          '_id' in maybeCharacter
        ) {
          return maybeCharacter._id ?? character;
        }
        return character;
      });
      const characterIds: Types.ObjectId[] = rawCharacterIds.map((cid) =>
        cid instanceof Types.ObjectId ? cid : new Types.ObjectId(String(cid)),
      );

      if (characterIds.length > 0) {
        await this.characterModel
          .updateMany(
            { _id: { $in: characterIds }, deletedAt: null },
            { $pull: { groups: id } },
          )
          .exec();

        const orphanCharacters = await this.characterModel
          .find({
            _id: { $in: characterIds },
            deletedAt: null,
            $or: [{ groups: { $exists: false } }, { groups: { $size: 0 } }],
          })
          .select('_id')
          .lean()
          .exec();

        const orphanCharacterIds = orphanCharacters.map(
          (character) => character._id,
        );

        if (orphanCharacterIds.length > 0) {
          await this.characterModel
            .updateMany(
              { _id: { $in: orphanCharacterIds }, deletedAt: null },
              { $set: { deletedAt: deletionDate } },
            )
            .exec();
        }
      }

      if (group.campaigns && group.campaigns.length > 0) {
        await this.campaignModel.updateMany(
          { _id: { $in: group.campaigns } },
          {
            $pull: {
              'groups.active': id,
              'groups.archived': id,
              'groups.main': id,
            },
          },
        );
      }

      group.characters = [];
      await group.save();

      const end: number = Date.now();

      const message = `Group #${id} delete in ${end - start}ms`;
      this.logger.verbose(message, this.SERVICE_NAME);
      return {
        message,
        data: group,
      };
    } catch (error) {
      const message = `Error while deleting group #${id}: ${error.message}`;
      this.logger.error(message, null, this.SERVICE_NAME);
      throw new InternalServerErrorException(message);
    }
  }
}
