import {
  Controller,
  Get,
  Param,
  Delete,
  Query,
  Req,
  UseGuards,
  Logger,
  NotFoundException,
  GoneException,
  ForbiddenException,
} from '@nestjs/common';
import { CharacterService } from '@/resources/character/character.service';
import { IsCreator } from '@/common/decorators/is-creator.decorator';
import { IsCreatorGuard } from '@/common/guards/is-creator.guard';
import { ParseNullableIntPipe } from '@/common/pipes/parse-nullable-int.pipe';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import {
  Character,
  CharacterDocument,
} from '@/resources/character/core/schemas/character.schema';
import { ParseMongoIdPipe } from '@/common/pipes/parse-mong-id.pipe';
import { IPaginatedResponse, IResponse } from '@/common/dtos/reponse.dto';
import {
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { ProblemDetailsDto } from '@/common/dtos/errors.dto';
import { SessionAccessService } from '@/common/session/session-access.service';

@UseGuards(IsCreatorGuard)
@Controller('characters')
export class CharacterController {
  constructor(
    private readonly characterService: CharacterService,
    private readonly sessionAccessService: SessionAccessService,
    @InjectModel(Character.name)
    private characterModel: Model<CharacterDocument>,
  ) {}

  private readonly CONTROLLER_NAME = CharacterService.name;
  private readonly logger = new Logger(this.CONTROLLER_NAME);

  private async validateResource(id: Types.ObjectId): Promise<void> {
    const character = await this.characterModel.findById(id).exec();

    if (!character) {
      const message = `Character ${id} not found`;
      this.logger.error(message, null, this.CONTROLLER_NAME);
      throw new NotFoundException(message);
    }

    if (character.deletedAt) {
      const message = `Character ${id} is gone`;
      this.logger.error(message, null, this.CONTROLLER_NAME);
      throw new GoneException(message);
    }
  }

  @Get()
  @ApiOperation({
    summary: 'Get a collection of paginated characters',
    security: [],
  })
  @ApiOkResponse({
    description: 'Characters found successfully',
    schema: {
      allOf: [
        { $ref: getSchemaPath(IPaginatedResponse) },
        {
          properties: {
            data: {
              type: 'array',
              items: { $ref: getSchemaPath(Character) },
            },
          },
        },
      ],
    },
  })
  findAll(
    @Req() request,
    @Query('page', ParseNullableIntPipe) page?: number,
    @Query('offset', ParseNullableIntPipe) offset?: number,
    @Query('name') name?: string,
    @Query('sort') sort?: string,
  ): Promise<IResponse<Character[]>> {
    const userId = request.user.keycloakId;
    return this.characterService.findAllByUser(userId, {
      page,
      offset,
      name,
      sort,
    });
  }

  @ApiOperation({ summary: 'Get a character by ID' })
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
    description: 'The ID of the character to get',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiOkResponse({
    description: 'Character found successfully',
    schema: {
      allOf: [
        { $ref: getSchemaPath(IResponse) },
        {
          properties: {
            data: { $ref: getSchemaPath(Character) },
          },
        },
      ],
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Character #ID not found',
    type: ProblemDetailsDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Error while fetching character #ID: Id is not a valid mongoose id',
    type: ProblemDetailsDto,
  })
  @ApiResponse({
    status: 410,
    description: 'Character #ID has been deleted',
    type: ProblemDetailsDto,
  })
  @Get(':id')
  async findOne(
    @Param('id', ParseMongoIdPipe) id: Types.ObjectId,
    @Req() req: { user: { keycloakId: string }; headers: { authorization?: string } },
    @Query('sessionCode') sessionCode?: string,
  ): Promise<IResponse<Character>> {
    await this.validateResource(id);

    const minimal = await this.characterModel
      .findById(id)
      .select('createdBy')
      .exec();

    if (!minimal) {
      const message = `Character ${id} not found`;
      this.logger.error(message, null, this.CONTROLLER_NAME);
      throw new NotFoundException(message);
    }

    const requesterId = req.user.keycloakId;
    if (minimal.createdBy !== requesterId) {
      const code = sessionCode?.trim();
      if (!code) {
        throw new ForbiddenException(
          'You can only view your own characters without an active session context',
        );
      }
      await this.sessionAccessService.assertRosterRead(
        req.headers.authorization,
        code,
        id.toString(),
      );
    }

    return this.characterService.findOne(id);
  }

  @IsCreator(CharacterService)
  @ApiOperation({ summary: 'Delete a character by ID' })
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
    description: 'The ID of the character to delete',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiOkResponse({
    description: 'Character #ID deleted',
    schema: {
      allOf: [
        { $ref: getSchemaPath(IResponse) },
        {
          properties: {
            data: { $ref: getSchemaPath(Character) },
          },
        },
      ],
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Character #ID not found',
    type: ProblemDetailsDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Error while fetching character #ID: Id is not a valid mongoose id',
    type: ProblemDetailsDto,
  })
  @ApiResponse({
    status: 410,
    description: 'Character #ID has been deleted',
    type: ProblemDetailsDto,
  })
  @Delete(':id')
  async remove(
    @Param('id', ParseMongoIdPipe) id: Types.ObjectId,
  ): Promise<IResponse<Character>> {
    await this.validateResource(id);

    return this.characterService.remove(id);
  }
}
