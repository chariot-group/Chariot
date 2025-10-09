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

@Injectable()
export class GroupService {
  constructor(
    @InjectModel(Group.name) private groupModel: Model<GroupDocument>,
    @InjectModel(Campaign.name) private campaignModel: Model<CampaignDocument>,
    @InjectModel(Character.name)
    private characterModel: Model<CharacterDocument>,
  ) { }

  private readonly SERVICE_NAME = GroupService.name;
  private readonly logger = new Logger(this.SERVICE_NAME);

  async create(createGroupDto: CreateGroupDto, userId: string) {
    try {
      const { characters = [], campaigns, ...groupData } = createGroupDto;

      const start: number = Date.now();
      const group = await this.groupModel.create({
        ...groupData,
        characters,
        campaigns: campaigns.map((campaign) => campaign.idCampaign),
        createdBy: new Types.ObjectId(userId),
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
      const end: number = Date.now();

      const message = `Group created in ${end - start}ms`;
      this.logger.verbose(message, this.SERVICE_NAME);
      return {
        message,
        data: group,
      };
    } catch (error) {
      const errorMessage = `Error while creating group: ${error.message}`;
      this.logger.error(errorMessage, null, this.SERVICE_NAME);
      throw new InternalServerErrorException(errorMessage);
    }
  }

  async findAllByUser(
    userId: Types.ObjectId,
    query: {
      page?: number;
      offset?: number;
      label?: string;
      sort?: string;
      onlyWithMembers?: any;
    },
    campaignId?: string,
    type: 'all' | 'main' | 'npc' | 'archived' = 'all',
  ) {
    try {
      const {
        label = '',
        page = 1,
        offset = 10,
        sort = 'updatedAt',
        onlyWithMembers = false,
      } = query;

      let sortCriteria: { [key: string]: SortOrder } = { updatedAt: 'asc' };
      if (query.sort) {
        query.sort.startsWith('-')
          ? (sortCriteria[query.sort.substring(1)] = 'desc')
          : (sortCriteria[query.sort] = 'asc');
      }

      const filters: any = {
        label: { $regex: `${decodeURIComponent(label)}`, $options: 'i' },
        deletedAt: { $eq: null },
        createdBy: new Types.ObjectId(userId),
      };

      if (onlyWithMembers == 'true') {
        filters.characters = { $ne: [] };
      }

      if (campaignId) {
        const campaign = await this.campaignModel.findById(campaignId).lean();
        if (!campaign) {
          const message = `Error while fetching groups: Campaign #${campaignId} not found`;
          this.logger.error(message, null, this.SERVICE_NAME);
          throw new NotFoundException(message);
        }

        let groupIds: string[] = [];
        if (type === 'all') {
          groupIds = [
            ...(campaign.groups?.main || []).map((group: any) =>
              group.toString(),
            ),
            ...(campaign.groups?.npc || []).map((group: any) =>
              group.toString(),
            ),
            ...(campaign.groups?.archived || []).map((group: any) =>
              group.toString(),
            ),
          ];
        } else {
          groupIds = (campaign.groups?.[type] || []).map((group: any) =>
            group.toString(),
          );
        }

        filters['campaigns'] = { $in: [campaignId] };
        filters['_id'] = { $in: groupIds };
      }

      const start: number = Date.now();
      const groups = await this.groupModel
        .find(filters)
        .sort({ ...sortCriteria, _id: 'asc' })
        .limit(offset)
        .skip((page - 1) * offset)
        .exec();

      const totalItems = await this.groupModel.countDocuments(filters);
      const end: number = Date.now();

      const message = `Groups found in ${end - start}ms`;
      this.logger.verbose(message);

      return {
        message: message,
        data: groups,
        pagination: {
          page: page,
          offset: offset,
          total: totalItems,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      const errorMessage = `Error while fetching groups: ${error.message}`;
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
      group.deletedAt = new Date();

      const updated = await this.characterModel
        .updateMany(
          { _id: { $in: group.characters } },
          { $pull: { groups: id } },
        )
        .exec();

      group.characters = [];
      group.save();

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
