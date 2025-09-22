import {
  BadRequestException,
  GoneException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateNpcDto } from '@/resources/character/npc/dto/create-npc.dto';
import { UpdateNpcDto } from '@/resources/character/npc/dto/update-npc.dto';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Group, GroupDocument } from '@/resources/group/schemas/group.schema';
import {
  Character,
  CharacterDocument,
} from '@/resources/character/core/schemas/character.schema';

@Injectable()
export class NpcService {
  constructor(
    @InjectModel(Character.name)
    private characterModel: Model<CharacterDocument>,
    @InjectModel(Group.name) private groupModel: Model<GroupDocument>,
  ) { }

  private readonly SERVICE_NAME = NpcService.name;
  private readonly logger = new Logger(this.SERVICE_NAME);

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

  async create(createNpcDto: CreateNpcDto, userId: Types.ObjectId) {
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

      const start = Date.now();
      const newNpc = new this.characterModel.discriminators['npc']({
        ...createNpcDto,
        createdBy: new Types.ObjectId(userId),
      });
      const savedNpc = await newNpc.save();
      if (createNpcDto.groups && createNpcDto.groups.length > 0) {
        await this.groupModel.updateMany(
          {
            _id: { $in: createNpcDto.groups },
          },
          { $addToSet: { characters: savedNpc._id } },
        );
      }
      const end = Date.now();

      const message = `NPC created in ${end - start}ms`;
      return {
        message,
        data: savedNpc,
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof GoneException
      ) {
        throw error;
      }
      let message = `Error creating NPC: ${error.message}`;
      this.logger.error(message);
      throw new InternalServerErrorException(message);
    }
  }

  async update(id: Types.ObjectId, updateNpcDto: UpdateNpcDto) {
    try {
      let { groups, ...npcData } = updateNpcDto;

      let npc = await this.characterModel.findById(id).exec();

      //Vérification ids characters
      if (groups) {
        const groupCheckPromises = groups.map((groupId) =>
          this.groupModel.findById(groupId).exec(),
        );
        const groupCheckResults = await Promise.all(groupCheckPromises);
        const invalidGroups = groupCheckResults.filter((group) => !group);
        if (invalidGroups.length > 0) {
          const invalidNpcIds = groups.filter(
            (_, index) => !groupCheckResults[index],
          );
          const message = `Invalid group IDs: ${invalidNpcIds.join(', ')}`;
          this.logger.error(message, null, this.SERVICE_NAME);
          throw new BadRequestException(message);
        }

        const goneGroups = groupCheckResults.filter((group) => group.deletedAt);
        if (goneGroups.length > 0) {
          const goneGroupIds = goneGroups.map((group) => group._id.toString());
          const message = `Gone group IDs: ${goneGroupIds.join(', ')}`;
          this.logger.error(message, null, this.SERVICE_NAME);
          throw new GoneException(message);
        }
      } else {
        groups = npc.groups.map((group) => group._id.toString());
      }

      const groupsToRemove = npc.groups.filter(
        (oldGroups) =>
          !groups.some((newGroups) => newGroups === oldGroups._id.toString()),
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
        this.logger.error(message, null, this.SERVICE_NAME);
        throw new NotFoundException(message);
      }

      const message = `NPC #${id} update in ${end - start}ms`;
      this.logger.verbose(message, this.SERVICE_NAME);
      return {
        message,
        data: npc,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof GoneException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      const message = `Error while updating #${id} NPC: ${error.message}`;
      this.logger.error(message, null, this.SERVICE_NAME);
      throw new InternalServerErrorException(message);
    }
  }
}
