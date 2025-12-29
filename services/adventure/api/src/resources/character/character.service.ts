import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  GoneException,
  HttpException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  Character,
  CharacterDocument,
} from '@/resources/character/core/schemas/character.schema';
import { Model, SortOrder, Types } from 'mongoose';
import { Group, GroupDocument } from '@/resources/group/schemas/group.schema';
import { IPaginatedResponse, IResponse } from '@/common/dtos/reponse.dto';

@Injectable()
export class CharacterService {
  constructor(
    @InjectModel(Character.name)
    private characterModel: Model<CharacterDocument>,
    @InjectModel(Group.name) private groupModel: Model<GroupDocument>,
  ) { }

  private readonly SERVICE_NAME = CharacterService.name;
  private readonly logger = new Logger(this.SERVICE_NAME);

  async findAllByUser(
    userId: string,
    query: { page?: number; offset?: number; name?: string; sort?: string },
    groupId?: string,
  ): Promise<IPaginatedResponse<Character[]>> {
    try {
      let { name = '', page = 1, offset = 10 } = query;
      let sort: { [key: string]: SortOrder } = { updatedAt: 'asc' };
      if (query.sort) {
        query.sort.startsWith('-')
          ? (sort[query.sort.substring(1)] = 'desc')
          : (sort[query.sort] = 'asc');
      }
      const filters: Record<string, any> = {
        name: { $regex: `${decodeURIComponent(name)}`, $options: 'i' },
        deletedAt: { $eq: null },
        createdBy: userId,
      };
      if (groupId) {
        filters['groups'] = { $in: [groupId] };
      }
      const start: number = Date.now();
      const characters: Character[] = await this.characterModel
        .find(filters)
        .sort(sort)
        .limit(offset)
        .skip((page - 1) * offset);
      const nbCharacters: number = await this.characterModel.countDocuments(filters);
      const end: number = Date.now();

      let message: string = `Characters found in ${end - start}ms`;
      this.logger.verbose(message, this.SERVICE_NAME);
      return {
        message: message,
        data: characters,
        pagination: {
          page: page,
          offset: offset,
          totalItems: nbCharacters,
        },
      };
    } catch (error) {
      const message: string = `Error while fetching characters: ${error.message}`;
      this.logger.error(message, null, this.SERVICE_NAME);
      throw new InternalServerErrorException(message);
    }
  }

  async findOne(id: Types.ObjectId): Promise<IResponse<Character>> {
    try {
      const start: number = Date.now();
      const character: Character = await this.characterModel
        .findById(id)
        .populate('groups')
        .exec();
      const end: number = Date.now();

      const message: string = `Character #${id} found in ${end - start}ms`;
      this.logger.verbose(message, this.SERVICE_NAME);
      return {
        message,
        data: character,
      };
    } catch (error) {
      const message: string = `Error while fetching character #${id}: ${error.message}`;
      this.logger.error(message, null, this.SERVICE_NAME);
      throw new InternalServerErrorException(message);
    }
  }

  async remove(id: Types.ObjectId): Promise<IResponse<Character>> {
    try {
      const start: number = Date.now();

      const character: CharacterDocument = await this.characterModel.findById(id).exec();
      if (!character) {
        const message: string = `Character #${id} not found`;
        this.logger.error(message, null, this.SERVICE_NAME);
        throw new NotFoundException(message);
      }

      if (character.deletedAt) {
        const message: string = `Character #${id} already deleted`;
        this.logger.error(message, null, this.SERVICE_NAME);
        throw new GoneException(message);
      }

      character.deletedAt = new Date();
      character.groups.forEach(async (groupId) => {
        await this.groupModel
          .updateOne({ _id: groupId }, { $pull: { characters: id } })
          .exec();
      });
      await character.save();

      const end: number = Date.now();

      const message: string = `Character #${id} delete in ${end - start}ms`;
      this.logger.verbose(message, this.SERVICE_NAME);
      return {
        message,
        data: character,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      const message: string = `Error while deleting character #${id}: ${error.message}`;
      this.logger.error(message, null, this.SERVICE_NAME);
      throw new InternalServerErrorException(message);
    }
  }
}
