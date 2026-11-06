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
  ForbiddenException,
} from '@nestjs/common';
import { NpcService } from '@/resources/character/npc/npc.service';
import { CreateNpcDto } from '@/resources/character/npc/dto/create-npc.dto';
import { UpdateNpcDto } from '@/resources/character/npc/dto/update-npc.dto';
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
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { ProblemDetailsDto } from '@/common/dtos/errors.dto';
import { SessionAccessService } from '@/common/session/session-access.service';

@ApiExtraModels(IResponse, IPaginatedResponse, NPC)
@Controller('characters/npcs')
export class NpcController {
  constructor(
    private readonly npcService: NpcService,
    @InjectModel(Character.name)
    private characterModel: Model<CharacterDocument>,
    private readonly sessionAccessService: SessionAccessService,
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
    summary:
      'Get paginated unlinked NPCs without a group for the authenticated user',
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
    @Query('sessionCode') sessionCode?: string,
  ): Promise<IResponse<Character[]>> {
    const userId = request.user.keycloakId;
    const ids = (playerIds ?? '')
      .split(',')
      .map((id) => id.trim())
      .filter((id) => id.length > 0);
    const code = sessionCode?.trim();
    if (code && ids.length > 0) {
      return this.getSessionCompanions(request, code, ids);
    }
    return this.npcService.findNpcsByLinkedPlayerIds(userId, ids);
  }

  /** @see FR-session-player-companion-combatants */
  private async getSessionCompanions(
    request: {
      user: { keycloakId: string };
      headers: { authorization?: string };
    },
    sessionCode: string,
    playerIds: string[],
  ): Promise<IResponse<Character[]>> {
    await this.sessionAccessService.assertGmCompanionLookup(
      request.headers.authorization,
      sessionCode,
      playerIds,
    );
    return this.npcService.findNpcsByLinkedPlayerIds(null, playerIds);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseMongoIdPipe) id: Types.ObjectId,
    @Body() updateNpcDto: UpdateNpcDto,
    @Req()
    request: {
      user: { keycloakId: string };
      headers: { authorization?: string };
    },
    @Query('sessionCode') sessionCode?: string,
  ): Promise<IResponse<Character>> {
    await this.validateResource(id);

    const npcDoc = await this.characterModel
      .findById(id)
      .select('createdBy kind linkedPlayerId')
      .exec();
    if (!npcDoc) {
      const message = `NPC #${id} not found`;
      this.logger.debug(message, this.CONTROLLER_NAME);
      throw new NotFoundException(message);
    }

    const userId = request.user.keycloakId;
    let payload = updateNpcDto;
    if (npcDoc.createdBy !== userId) {
      const code = sessionCode?.trim();
      if (!code) {
        throw new ForbiddenException(
          'You can only update your own characters outside of an authorized session',
        );
      }
      const linked = (npcDoc as unknown as { linkedPlayerId?: unknown })
        .linkedPlayerId;
      const linkedPlayerId = linked ? String(linked) : undefined;
      await this.sessionAccessService.assertGmEdit(
        request.headers.authorization,
        code,
        id.toString(),
        linkedPlayerId,
      );
      if (Object.prototype.hasOwnProperty.call(payload, 'linkedPlayerId')) {
        const rest = { ...payload };
        delete rest.linkedPlayerId;
        payload = rest;
      }
    }

    return this.npcService.update(id, payload);
  }
}
