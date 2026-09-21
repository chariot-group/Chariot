import {
  BadRequestException,
  ForbiddenException,
  GoneException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateNpcDto } from '@/resources/character/npc/dto/create-npc.dto';
import { UpdateNpcDto } from '@/resources/character/npc/dto/update-npc.dto';
import { Model, SortOrder, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Group, GroupDocument } from '@/resources/group/schemas/group.schema';
import {
  Character,
  CharacterDocument,
} from '@/resources/character/core/schemas/character.schema';
import { NPC, NPCDocument } from '@/resources/character/npc/schemas/npc.schema';
import { IPaginatedResponse, IResponse } from '@/common/dtos/reponse.dto';

@Injectable()
export class NpcService {
  constructor(
    @InjectModel(Character.name)
    private characterModel: Model<CharacterDocument>,
    @InjectModel(Group.name) private groupModel: Model<GroupDocument>,
  ) {}

  private readonly SERVICE_NAME = NpcService.name;
  private readonly logger = new Logger(this.SERVICE_NAME);

  private groupRefToIdString(
    ref: Types.ObjectId | Pick<GroupDocument, '_id'>,
  ): string {
    return ref instanceof Types.ObjectId ? ref.toString() : ref._id.toString();
  }

  private async validateGroupRelations(groupIds: string[]): Promise<void> {
    if (!groupIds || groupIds.length === 0) return;

    for (const groupId of groupIds) {
      if (!Types.ObjectId.isValid(groupId)) {
        throw new BadRequestException(`Invalid group ID: #${groupId}`);
      }

      const group = await this.groupModel.findById(groupId).exec();
      if (!group) {
        throw new NotFoundException(`Group not found: #${groupId}`);
      }

      if (group.deletedAt) {
        throw new GoneException(`Group already deleted: #${groupId}`);
      }
    }
  }

  /**
   * @see FR-npc-player-link
   */
  async validateLinkedPlayerId(
    linkedPlayerId: string | null | undefined,
    userId: string,
  ): Promise<void> {
    if (linkedPlayerId === undefined || linkedPlayerId === null || linkedPlayerId === '') {
      return;
    }

    if (!Types.ObjectId.isValid(linkedPlayerId)) {
      throw new BadRequestException(`Invalid player ID: #${linkedPlayerId}`);
    }

    const player = await this.characterModel.findById(linkedPlayerId).exec();
    if (!player) {
      throw new NotFoundException(`Player not found: #${linkedPlayerId}`);
    }

    if (player.deletedAt) {
      throw new GoneException(`Player already deleted: #${linkedPlayerId}`);
    }

    const kind = (player as Character & { kind?: string }).kind;
    if (kind !== 'player') {
      throw new BadRequestException(
        `linkedPlayerId must reference a Player character: #${linkedPlayerId}`,
      );
    }

    if (player.createdBy !== userId) {
      throw new ForbiddenException(
        `You can only link NPCs to your own Player characters`,
      );
    }
  }

  private paginationSort(query: {
    page?: number;
    offset?: number;
    sort?: string;
  }): { page: number; offset: number; skip: number; sort: { [key: string]: SortOrder } } {
    const page = query.page ?? 1;
    const offset = query.offset ?? 10;
    let sort: { [key: string]: SortOrder } = { updatedAt: 'asc' };
    if (query.sort) {
      if (query.sort.startsWith('-')) {
        sort[query.sort.substring(1)] = 'desc';
      } else {
        sort[query.sort] = 'asc';
      }
    }
    return { page, offset, skip: (page - 1) * offset, sort };
  }

  async create(
    createNpcDto: CreateNpcDto,
    userId: string,
  ): Promise<IResponse<NPC>> {
    try {
      if (createNpcDto.groups) {
        for (const groupId of createNpcDto.groups) {
          if (!Types.ObjectId.isValid(groupId)) {
            throw new BadRequestException(
              `Invalid group ID format: ${groupId}`,
            );
          }
        }
        await this.validateGroupRelations(createNpcDto.groups);
      }

      await this.validateLinkedPlayerId(createNpcDto.linkedPlayerId, userId);

      const start: number = Date.now();
      const newNpc: NPCDocument = new this.characterModel.discriminators['npc'](
        {
          ...createNpcDto,
          createdBy: userId,
        },
      );
      const savedNpc: NPC = await newNpc.save();
      if (createNpcDto.groups && createNpcDto.groups.length > 0) {
        await this.groupModel.updateMany(
          {
            _id: { $in: createNpcDto.groups },
          },
          { $addToSet: { characters: savedNpc._id } },
        );
      }

      const end: number = Date.now();

      const message: string = `NPC created in ${end - start}ms`;
      this.logger.log(message, this.SERVICE_NAME);
      return {
        message,
        data: savedNpc,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      let message: string = `Error creating NPC: ${error.message}`;
      this.logger.error(message);
      throw new InternalServerErrorException(message);
    }
  }

  async update(
    id: Types.ObjectId,
    updateNpcDto: UpdateNpcDto,
  ): Promise<IResponse<Character>> {
    try {
      let { groups, ...npcData } = updateNpcDto;

      let npc: Character = await this.characterModel.findById(id).exec();
      if (!npc) {
        throw new NotFoundException(`NPC #${id} not found`);
      }

      if (
        Object.prototype.hasOwnProperty.call(updateNpcDto, 'linkedPlayerId')
      ) {
        await this.validateLinkedPlayerId(
          updateNpcDto.linkedPlayerId ?? null,
          npc.createdBy,
        );
      }

      //Vérification ids characters
      if (groups) {
        const groupCheckPromises: Promise<GroupDocument | null>[] = groups.map(
          (groupId) => this.groupModel.findById(groupId).exec(),
        );
        const groupCheckResults: (GroupDocument | null)[] =
          await Promise.all(groupCheckPromises);
        const invalidGroups: (GroupDocument | null)[] =
          groupCheckResults.filter((group) => !group);
        if (invalidGroups.length > 0) {
          const invalidNpcIds: string[] = groups.filter(
            (_, index) => !groupCheckResults[index],
          );
          const message: string = `Invalid group IDs: ${invalidNpcIds.join(', ')}`;
          this.logger.debug(message, this.SERVICE_NAME);
          throw new BadRequestException(message);
        }

        const goneGroups: (GroupDocument | null)[] = groupCheckResults.filter(
          (group) => group.deletedAt,
        );
        if (goneGroups.length > 0) {
          const goneGroupIds: string[] = goneGroups.map((group) =>
            group._id.toString(),
          );
          const message: string = `Gone group IDs: ${goneGroupIds.join(', ')}`;
          this.logger.debug(message, this.SERVICE_NAME);
          throw new GoneException(message);
        }
      } else {
        groups = npc.groups.map((group) => this.groupRefToIdString(group));
      }

      const groupsToRemove = npc.groups.filter(
        (oldGroups) =>
          !groups.some(
            (newGroups) => newGroups === this.groupRefToIdString(oldGroups),
          ),
      );

      const start: number = Date.now();
      const npcUpdate = await this.characterModel.discriminators['npc']
        .updateOne(
          { _id: id },
          {
            ...npcData,
            groups,
          },
        )
        .exec();
      npc = await this.characterModel.findById(id).populate('groups').exec();

      await this.groupModel.updateMany(
        { _id: { $in: groups.map((id) => id) } },
        { $addToSet: { characters: id } },
      );
      await this.groupModel.updateMany(
        { _id: { $in: groupsToRemove } },
        { $pull: { characters: id } },
      );

      const end: number = Date.now();

      if (npcUpdate.modifiedCount === 0) {
        const message = `NPC #${id} not found`;
        this.logger.debug(message, this.SERVICE_NAME);
        throw new NotFoundException(message);
      }

      const message = `NPC #${id} update in ${end - start}ms`;
      this.logger.log(message, this.SERVICE_NAME);
      return {
        message,
        data: npc,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      const message = `Error while updating #${id} NPC: ${error.message}`;
      this.logger.error(message, null, this.SERVICE_NAME);
      throw new InternalServerErrorException(message);
    }
  }

  /**
   * Unlinked NPCs with no group, owned by the authenticated user.
   * @see FR-npc-player-link
   */
  async findUnlinkedNpcsWithoutGroup(
    userId: string,
    query: { page?: number; offset?: number; sort?: string },
  ): Promise<IPaginatedResponse<Character[]>> {
    try {
      const { page, offset, skip, sort } = this.paginationSort(query);
      const filters = {
        kind: 'npc',
        createdBy: userId,
        deletedAt: null,
        $and: [
          { $or: [{ groups: { $exists: false } }, { groups: { $size: 0 } }] },
          {
            $or: [
              { linkedPlayerId: { $exists: false } },
              { linkedPlayerId: null },
            ],
          },
        ],
      };

      const start: number = Date.now();
      const npcs: Character[] = await this.characterModel
        .find(filters)
        .limit(offset)
        .skip(skip)
        .sort(sort)
        .exec();
      const totalItems: number =
        await this.characterModel.countDocuments(filters);
      const end: number = Date.now();

      const message = `Unlinked NPCs without group found in ${end - start}ms`;
      this.logger.debug(message, this.SERVICE_NAME);

      return {
        message,
        data: npcs,
        pagination: { page, offset, totalItems },
      };
    } catch (error) {
      const message = `Error retrieving unlinked NPCs without group: ${error.message}`;
      this.logger.error(message, null, this.SERVICE_NAME);
      throw new InternalServerErrorException(message);
    }
  }

  /**
   * All owned unlinked NPCs (picker for the Companions tab).
   * @see FR-npc-player-link
   */
  async findUnlinkedNpcs(
    userId: string,
    query: { page?: number; offset?: number; sort?: string },
  ): Promise<IPaginatedResponse<Character[]>> {
    try {
      const { page, offset, skip, sort } = this.paginationSort(query);
      const filters = {
        kind: 'npc',
        createdBy: userId,
        deletedAt: null,
        $or: [{ linkedPlayerId: { $exists: false } }, { linkedPlayerId: null }],
      };

      const start: number = Date.now();
      const npcs: Character[] = await this.characterModel
        .find(filters)
        .limit(offset)
        .skip(skip)
        .sort(sort)
        .exec();
      const totalItems: number =
        await this.characterModel.countDocuments(filters);
      const end: number = Date.now();

      const message = `Unlinked NPCs found in ${end - start}ms`;
      this.logger.debug(message, this.SERVICE_NAME);

      return {
        message,
        data: npcs,
        pagination: { page, offset, totalItems },
      };
    } catch (error) {
      const message = `Error retrieving unlinked NPCs: ${error.message}`;
      this.logger.error(message, null, this.SERVICE_NAME);
      throw new InternalServerErrorException(message);
    }
  }

  /**
   * NPCs linked to the given Player ids, owned by the authenticated user.
   * @see FR-npc-player-link
   */
  async findNpcsByLinkedPlayerIds(
    userId: string,
    playerIds: string[],
  ): Promise<IResponse<Character[]>> {
    try {
      if (playerIds.length > 100) {
        throw new BadRequestException(
          'A maximum of 100 player IDs can be queried at once',
        );
      }

      const objectIds: Types.ObjectId[] = [];
      for (const playerId of playerIds) {
        if (!Types.ObjectId.isValid(playerId)) {
          throw new BadRequestException(`Invalid player ID: #${playerId}`);
        }
        objectIds.push(new Types.ObjectId(playerId));
      }

      const start: number = Date.now();
      const npcs: Character[] =
        objectIds.length === 0
          ? []
          : await this.characterModel
              .find({
                kind: 'npc',
                createdBy: userId,
                deletedAt: null,
                linkedPlayerId: { $in: objectIds },
              })
              .exec();
      const end: number = Date.now();

      const message = `Linked NPCs found in ${end - start}ms`;
      this.logger.debug(message, this.SERVICE_NAME);

      return { message, data: npcs };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      const message = `Error retrieving NPCs by linked players: ${error.message}`;
      this.logger.error(message, null, this.SERVICE_NAME);
      throw new InternalServerErrorException(message);
    }
  }
}
