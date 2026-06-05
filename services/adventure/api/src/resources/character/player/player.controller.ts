import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  Req,
  Logger,
  BadRequestException,
  GoneException,
  NotFoundException,
  ForbiddenException,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PlayerService } from '@/resources/character/player/player.service';
import { CreatePlayerDto } from '@/resources/character/player/dto/create-player.dto';
import { UpdatePlayerDto } from '@/resources/character/player/dto/update-player.dto';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import {
  Character,
  CharacterDocument,
} from '@/resources/character/core/schemas/character.schema';
import { Group, GroupDocument } from '@/resources/group/schemas/group.schema';
import { ParseMongoIdPipe } from '@/common/pipes/parse-mong-id.pipe';
import { ParseNullableIntPipe } from '@/common/pipes/parse-nullable-int.pipe';
import { IPaginatedResponse, IResponse } from '@/common/dtos/reponse.dto';
import { Player } from '@/resources/character/player/schemas/player.schema';
import {
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { ProblemDetailsDto } from '@/common/dtos/errors.dto';
import { IsCreatorGuard } from '@/common/guards/is-creator.guard';
import { SessionAccessService } from '@/common/session/session-access.service';

@ApiExtraModels(IResponse, IPaginatedResponse, Player)
@Controller('characters/players')
@UseGuards(IsCreatorGuard)
export class PlayerController {
  constructor(
    private readonly playerService: PlayerService,
    private readonly sessionAccessService: SessionAccessService,
    @InjectModel(Character.name)
    private characterModel: Model<CharacterDocument>,
    @InjectModel(Group.name)
    private groupModel: Model<GroupDocument>,
  ) {}

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

  @ApiOperation({ summary: 'Create a new player' })
  @ApiOkResponse({
    description: 'The player has been successfully created.',
    schema: {
      allOf: [
        { $ref: getSchemaPath(IResponse) },
        {
          properties: {
            data: { $ref: getSchemaPath(Player) },
          },
        },
      ],
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
    type: ProblemDetailsDto,
  })
  @Post()
  async createPlayer(
    @Req() request,
    @Body() createPlayerDto: CreatePlayerDto,
  ): Promise<IResponse<Player>> {
    await this.validateGroupRelations(createPlayerDto.groups);
    const userId = request.user.keycloakId;

    return this.playerService.create(createPlayerDto, userId);
  }

  @ApiOperation({ summary: 'Get a collection of paginated players' })
  @ApiOkResponse({
    description: 'Players found successfully',
    schema: {
      allOf: [
        { $ref: getSchemaPath(IPaginatedResponse) },
        {
          properties: {
            data: {
              type: 'array',
              items: { $ref: getSchemaPath(Player) },
            },
          },
        },
      ],
    },
  })
  @Get('/without-group')
  async getPlayersWithoutGroup(
    @Req() request,
    @Query('page', ParseNullableIntPipe) page?: number,
    @Query('offset', ParseNullableIntPipe) offset?: number,
    @Query('sort') sort?: string,
  ): Promise<IPaginatedResponse<Character[]>> {
    const userId = request.user.keycloakId;
    return this.playerService.findPlayersWithoutGroup(userId, {
      page,
      offset,
      sort,
    });
  }

  @ApiOperation({ summary: 'Update a player by ID' })
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
    description: 'The ID of the player to update',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiOkResponse({
    description: 'Player updated successfully',
    schema: {
      allOf: [
        { $ref: getSchemaPath(IResponse) },
        {
          properties: {
            data: { $ref: getSchemaPath(Player) },
          },
        },
      ],
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
    type: ProblemDetailsDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Player #ID not found',
    type: ProblemDetailsDto,
  })
  @ApiResponse({
    status: 410,
    description: 'Player #ID has been deleted',
    type: ProblemDetailsDto,
  })
  @Patch(':id')
  async update(
    @Param('id', ParseMongoIdPipe) id: Types.ObjectId,
    @Body() updatePlayerDto: UpdatePlayerDto,
    @Req()
    request: {
      user: { keycloakId: string };
      headers: { authorization?: string };
    },
    @Query('sessionCode') sessionCode?: string,
  ): Promise<IResponse<Character>> {
    await this.validateResource(id);
    await this.validateGroupRelations(updatePlayerDto.groups);

    const playerDoc = await this.characterModel
      .findById(id)
      .select('createdBy')
      .exec();
    if (!playerDoc) {
      const message = `Player #${id} not found`;
      this.logger.error(message, null, this.CONTROLLER_NAME);
      throw new NotFoundException(message);
    }

    const userId = request.user.keycloakId;
    if (playerDoc.createdBy !== userId) {
      const code = sessionCode?.trim();
      if (!code) {
        throw new ForbiddenException(
          'You can only update your own characters outside of an authorized session',
        );
      }
      await this.sessionAccessService.assertGmEdit(
        request.headers.authorization,
        code,
        id.toString(),
      );
    }

    return this.playerService.update(id, updatePlayerDto);
  }
}
