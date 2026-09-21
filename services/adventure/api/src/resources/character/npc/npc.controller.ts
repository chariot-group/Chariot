import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  Req,
  Get,
  Query,
  GoneException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { NpcService } from '@/resources/character/npc/npc.service';
import { CreateNpcDto } from '@/resources/character/npc/dto/create-npc.dto';
import { UpdateNpcDto } from '@/resources/character/npc/dto/update-npc.dto';
import { IsCreator } from '@/common/decorators/is-creator.decorator';
import { CharacterService } from '@/resources/character/character.service';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import {
  Character,
  CharacterDocument,
} from '@/resources/character/core/schemas/character.schema';
import { ParseMongoIdPipe } from '@/common/pipes/parse-mong-id.pipe';
import { ParseNullableIntPipe } from '@/common/pipes/parse-nullable-int.pipe';
import { NPC } from '@/resources/character/npc/schemas/npc.schema';
import { IPaginatedResponse, IResponse } from '@/common/dtos/reponse.dto';
import {
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { ProblemDetailsDto } from '@/common/dtos/errors.dto';

@ApiExtraModels(IResponse, IPaginatedResponse, NPC)
@Controller('characters/npcs')
export class NpcController {
  constructor(
    private readonly npcService: NpcService,
    @InjectModel(Character.name)
    private characterModel: Model<CharacterDocument>,
  ) {}

  private readonly CONTROLLER_NAME = NpcController.name;
  private readonly logger = new Logger(this.CONTROLLER_NAME);

  private async validateResource(id: Types.ObjectId): Promise<void> {
    const npc = await this.characterModel.findById(id).exec();

    if (!npc) {
      const message = `NPC #${id} not found`;
      this.logger.debug(message, this.CONTROLLER_NAME);
      throw new NotFoundException(message);
    }

    if (npc.deletedAt) {
      const message = `NPC #${id} is gone`;
      this.logger.debug(message, this.CONTROLLER_NAME);
      throw new GoneException(message);
    }
  }

  @Post()
  @ApiOperation({ summary: 'Create a new NPC' })
  @ApiOkResponse({
    description: 'The NPC has been successfully created.',
    schema: {
      allOf: [
        { $ref: getSchemaPath(IResponse) },
        {
          properties: {
            data: { $ref: getSchemaPath(NPC) },
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
  createNpc(
    @Req() request,
    @Body() createNpcDto: CreateNpcDto,
  ): Promise<IResponse<NPC>> {
    const userId = request.user.keycloakId;

    return this.npcService.create(createNpcDto, userId);
  }

  /** @see FR-npc-player-link */
  @Get('/without-group')
  @ApiOperation({
    summary: 'Get paginated unlinked NPCs without a group for the authenticated user',
  })
  @ApiOkResponse({
    description: 'Unlinked NPCs without group found successfully',
    schema: {
      allOf: [
        { $ref: getSchemaPath(IPaginatedResponse) },
        {
          properties: {
            data: {
              type: 'array',
              items: { $ref: getSchemaPath(NPC) },
            },
          },
        },
      ],
    },
  })
  getUnlinkedNpcsWithoutGroup(
    @Req() request,
    @Query('page', ParseNullableIntPipe) page?: number,
    @Query('offset', ParseNullableIntPipe) offset?: number,
    @Query('sort') sort?: string,
  ): Promise<IPaginatedResponse<Character[]>> {
    const userId = request.user.keycloakId;
    return this.npcService.findUnlinkedNpcsWithoutGroup(userId, {
      page,
      offset,
      sort,
    });
  }

  /** @see FR-npc-player-link */
  @Get('/unlinked')
  @ApiOperation({
    summary: 'Get paginated unlinked NPCs owned by the authenticated user',
  })
  @ApiOkResponse({
    description: 'Unlinked NPCs found successfully',
    schema: {
      allOf: [
        { $ref: getSchemaPath(IPaginatedResponse) },
        {
          properties: {
            data: {
              type: 'array',
              items: { $ref: getSchemaPath(NPC) },
            },
          },
        },
      ],
    },
  })
  getUnlinkedNpcs(
    @Req() request,
    @Query('page', ParseNullableIntPipe) page?: number,
    @Query('offset', ParseNullableIntPipe) offset?: number,
    @Query('sort') sort?: string,
  ): Promise<IPaginatedResponse<Character[]>> {
    const userId = request.user.keycloakId;
    return this.npcService.findUnlinkedNpcs(userId, {
      page,
      offset,
      sort,
    });
  }

  /** @see FR-npc-player-link */
  @Get('/by-linked-players')
  @ApiOperation({
    summary: 'Get NPCs linked to the given Player character IDs',
  })
  @ApiOkResponse({
    description: 'Linked NPCs found successfully',
    schema: {
      allOf: [
        { $ref: getSchemaPath(IResponse) },
        {
          properties: {
            data: {
              type: 'array',
              items: { $ref: getSchemaPath(NPC) },
            },
          },
        },
      ],
    },
  })
  getNpcsByLinkedPlayers(
    @Req() request,
    @Query('playerIds') playerIds?: string,
  ): Promise<IResponse<Character[]>> {
    const userId = request.user.keycloakId;
    const ids = (playerIds ?? '')
      .split(',')
      .map((id) => id.trim())
      .filter((id) => id.length > 0);
    return this.npcService.findNpcsByLinkedPlayerIds(userId, ids);
  }

  @IsCreator(CharacterService)
  @ApiOperation({ summary: 'Update a NPC by ID' })
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
    description: 'The ID of the NPC to update',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiOkResponse({
    description: 'Campaign updated successfully',
    schema: {
      allOf: [
        { $ref: getSchemaPath(IResponse) },
        {
          properties: {
            data: { $ref: getSchemaPath(NPC) },
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
    description: 'NPC #ID not found',
    type: ProblemDetailsDto,
  })
  @ApiResponse({
    status: 410,
    description: 'NPC #ID has been deleted',
    type: ProblemDetailsDto,
  })
  @Patch(':id')
  async update(
    @Param('id', ParseMongoIdPipe) id: Types.ObjectId,
    @Body() updateNpcDto: UpdateNpcDto,
  ): Promise<IResponse<Character>> {
    await this.validateResource(id);

    return this.npcService.update(id, updateNpcDto);
  }
}
