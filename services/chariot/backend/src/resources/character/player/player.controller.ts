import { Controller, Post, Body, Patch, Param, Req, Logger, BadRequestException, GoneException, NotFoundException } from '@nestjs/common';
import { PlayerService } from '@/resources/character/player/player.service';
import { CreatePlayerDto } from '@/resources/character/player/dto/create-player.dto';
import { UpdatePlayerDto } from '@/resources/character/player/dto/update-player.dto';
import { IsCreator } from '@/common/decorators/is-creator.decorator';
import { CharacterService } from '@/resources/character/character.service';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Character, CharacterDocument } from '@/resources/character/core/schemas/character.schema';
import { Group, GroupDocument } from '@/resources/group/schemas/group.schema';
import { ParseMongoIdPipe } from '@/common/pipes/parse-mong-id.pipe';

@Controller('characters/players')
export class PlayerController {
  constructor(
    private readonly playerService: PlayerService,
    @InjectModel(Character.name)
    private characterModel: Model<CharacterDocument>,
    @InjectModel(Group.name)
    private groupModel: Model<GroupDocument>,
  ) { }

  private readonly CONTROLLER_NAME = PlayerController.name;
  private readonly logger = new Logger(this.CONTROLLER_NAME);

  private async validateResource(id: Types.ObjectId): Promise<void> {
    const player = await this.characterModel.findById(id).exec();

    if (!player) {
      const message = `Player #${id} not found`;
      this.logger.error(message, null, this.CONTROLLER_NAME);
      throw new NotFoundException(message);
    }

    if (player.deletedAt) {
      const message = `Player #${id} is gone`;
      this.logger.error(message, null, this.CONTROLLER_NAME);
      throw new GoneException(message);
    }
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

  @Post()
  async createPlayer(@Req() request, @Body() createPlayerDto: CreatePlayerDto) {
    await this.validateGroupRelations(createPlayerDto.groups);
    const userId = request.user.userId;


    return this.playerService.create(createPlayerDto, userId);
  }

  @IsCreator(CharacterService)
  @Patch(':id')
  async update(@Param('id', ParseMongoIdPipe) id: Types.ObjectId, @Body() updatePlayerDto: UpdatePlayerDto) {
    await this.validateResource(id);
    await this.validateGroupRelations(updatePlayerDto.groups);

    return this.playerService.update(id, updatePlayerDto);
  }
}
