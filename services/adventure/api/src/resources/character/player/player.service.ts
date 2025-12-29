import {
  BadRequestException,
  GoneException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreatePlayerDto } from '@/resources/character/player/dto/create-player.dto';
import { UpdatePlayerDto } from '@/resources/character/player/dto/update-player.dto';
import { Model, Types } from 'mongoose';
import { Group, GroupDocument } from '@/resources/group/schemas/group.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Character } from '@/resources/character/core/schemas/character.schema';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter } from 'prom-client';
import { IResponse } from '@/common/dtos/reponse.dto';
import { Player, PlayerDocument } from './schemas/player.schema';

@Injectable()
export class PlayerService {
  constructor(
    @InjectModel(Character.name)
    private characterModel: Model<Character>,
    @InjectModel(Group.name) private groupModel: Model<GroupDocument>,
    @InjectMetric('chariot_characters_created_total')
    private readonly charactersCreatedCounter: Counter,
  ) { }

  private readonly SERVICE_NAME = PlayerService.name;
  private readonly logger = new Logger(this.SERVICE_NAME);

  async create(createPlayerDto: CreatePlayerDto, userId: string): Promise<IResponse<Player>> {
    try {
      if (createPlayerDto.groups) {
        for (const groupId of createPlayerDto.groups) {
          if (!Types.ObjectId.isValid(groupId)) {
            throw new BadRequestException(
              `Invalid group ID format: #${groupId}`,
            );
          }
        }
      }

      const start: number = Date.now();
      const newPlayer: PlayerDocument = new this.characterModel.discriminators['player']({
        ...createPlayerDto,
        createdBy: userId,
      });
      const savedPlayer: Player = await newPlayer.save();
      await this.groupModel.updateMany(
        {
          _id: {
            $in:
              createPlayerDto.groups && createPlayerDto.groups.map((id) => id),
          },
        },
        { $addToSet: { characters: savedPlayer._id } },
      );

      // Incrémentation du compteur Prometheus
      this.charactersCreatedCounter.inc({ user_id: userId });

      const end: number = Date.now();

      const message: string = `Player created in ${end - start}ms`;
      return {
        message,
        data: savedPlayer,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      let message: string = `Error creating Player: ${error.message}`;
      this.logger.error(message);
      throw new InternalServerErrorException(message);
    }
  }

  async update(id: Types.ObjectId, updatePlayerDto: UpdatePlayerDto): Promise<IResponse<Character>> {
    try {
      let { groups, ...playerData } = updatePlayerDto;

      let player: Character = await this.characterModel.findById(id).exec();

      //Vérification ids characters
      if (groups) {
        const groupCheckPromises: Promise<GroupDocument | null>[] = groups.map((groupId) =>
          this.groupModel.findById(groupId).exec(),
        );
        const groupCheckResults: (GroupDocument | null)[] = await Promise.all(groupCheckPromises);
        const invalidGroups: (GroupDocument | null)[] = groupCheckResults.filter((group) => !group);
        if (invalidGroups.length > 0) {
          const invalidPlayerIds: string[] = groups.filter(
            (_, index) => !groupCheckResults[index],
          );
          const message: string = `Invalid group IDs: ${invalidPlayerIds.join(', ')}`;
          this.logger.error(message, null, this.SERVICE_NAME);
          throw new BadRequestException(message);
        }

        const goneGroups: (GroupDocument | null)[] = groupCheckResults.filter((group) => group.deletedAt);
        if (goneGroups.length > 0) {
          const goneGroupIds: string[] = goneGroups.map((group) => group._id.toString());
          const message: string = `Gone group IDs: #${goneGroupIds.join(', #')}`;
          this.logger.error(message, null, this.SERVICE_NAME);
          throw new GoneException(message);
        }
      } else {
        groups = player.groups.map((group) => group._id.toString());
      }

      const groupsToRemove: Group[] = player.groups.filter(
        (oldGroups) =>
          !groups.some((newGroups) => newGroups === oldGroups._id.toString()),
      );

      const start: number = Date.now();
      const playerUpdate = await this.characterModel.discriminators['player']
        .updateOne(
          { _id: id },
          {
            ...playerData,
            groups,
          },
        )
        .exec();
      player = await this.characterModel.findById(id).populate('groups').exec();

      await this.groupModel.updateMany(
        { _id: { $in: groups.map((id) => id) } },
        { $addToSet: { characters: id } },
      );
      await this.groupModel.updateMany(
        { _id: { $in: groupsToRemove } },
        { $pull: { characters: id } },
      );

      const end: number = Date.now();

      if (playerUpdate.modifiedCount === 0) {
        const message: string = `Player #${id} not found`;
        this.logger.error(message, null, this.SERVICE_NAME);
        throw new NotFoundException(message);
      }

      const message = `Player #${id} update in ${end - start}ms`;
      this.logger.verbose(message, this.SERVICE_NAME);
      return {
        message,
        data: player,
      };
    } catch (error) {
      if (
        error instanceof HttpException
      ) {
        throw error;
      }
      const message: string = `Error while updating #${id} Player: ${error.message}`;
      this.logger.error(message, null, this.SERVICE_NAME);
      throw new InternalServerErrorException(message);
    }
  }
}
