import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Logger,
  Req,
  UseGuards,
  BadRequestException,
  NotFoundException,
  GoneException,
} from '@nestjs/common';
import { CampaignService } from '@/resources/campaign/campaign.service';
import { CreateCampaignDto } from '@/resources/campaign/dto/create-campaign.dto';
import { UpdateCampaignDto } from '@/resources/campaign/dto/update-campaign.dto';
import { ParseNullableIntPipe } from '@/common/pipes/parse-nullable-int.pipe';
import { GroupService } from '@/resources/group/group.service';
import { IsCreatorGuard } from '@/common/guards/is-creator.guard';
import { IsCreator } from '@/common/decorators/is-creator.decorator';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Group, GroupDocument } from '@/resources/group/schemas/group.schema';
import {
  Campaign,
  CampaignDocument,
} from '@/resources/campaign/schemas/campaign.schema';
import { ParseMongoIdPipe } from '@/common/pipes/parse-mong-id.pipe';
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

@ApiExtraModels(IResponse, IPaginatedResponse, Campaign, Group)
@UseGuards(IsCreatorGuard)
@Controller('campaigns')
export class CampaignController {
  constructor(
    private readonly campaignService: CampaignService,
    private readonly groupService: GroupService,
    @InjectModel(Campaign.name) private campaignModel: Model<CampaignDocument>,
    @InjectModel(Group.name) private groupModel: Model<GroupDocument>,
  ) {}

  private readonly CONTROLLER_NAME = CampaignController.name;
  private readonly logger = new Logger(this.CONTROLLER_NAME);

  private async validateGroupRelations(
    groupIds: string[],
    type: 'Active' | 'Archived',
  ): Promise<void> {
    if (!groupIds || groupIds.length === 0) return;

    for (const groupId of groupIds) {
      if (!Types.ObjectId.isValid(groupId)) {
        throw new BadRequestException(`Invalid ${type} group ID: ${groupId}`);
      }

      const group = await this.groupModel.findById(groupId).exec();

      if (!group) {
        throw new NotFoundException(`${type} group not found: ${groupId}`);
      }

      if (group.deletedAt) {
        throw new GoneException(`${type} group deleted: ${groupId}`);
      }
    }
  }

  private async validateResource(id: Types.ObjectId): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      const message = `Error while fetching campaign #${id}: Id is not a valid mongoose id`;
      this.logger.error(message, null, this.CONTROLLER_NAME);
      throw new BadRequestException(message);
    }
    const campaign = await this.campaignModel.findById(id).exec();

    if (!campaign) {
      const message = `Campaign #${id} not found`;
      this.logger.error(message, null, this.CONTROLLER_NAME);
      throw new NotFoundException(message);
    }

    if (campaign.deletedAt) {
      const message = `Campaign #${id} is gone`;
      this.logger.error(message, null, this.CONTROLLER_NAME);
      throw new GoneException(message);
    }
  }

  @Post()
  @ApiOperation({ summary: 'Create a new campaign' })
  @ApiOkResponse({
    description: 'The campaign has been successfully created.',
    schema: {
      allOf: [
        { $ref: getSchemaPath(IResponse) },
        {
          properties: {
            data: { $ref: getSchemaPath(Campaign) },
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
  async create(
    @Req() request,
    @Body() createCampaignDto: CreateCampaignDto,
  ): Promise<IResponse<Campaign>> {
    await this.validateGroupRelations(
      createCampaignDto.groups.active,
      'Active',
    );
    await this.validateGroupRelations(
      createCampaignDto.groups.archived,
      'Archived',
    );

    // Debug logging
    this.logger.debug(
      `Request user object: ${JSON.stringify(request.user)}`,
      this.CONTROLLER_NAME,
    );

    const userId = request.user?.keycloakId;

    if (!userId) {
      this.logger.error(
        `User authentication failed - user object: ${JSON.stringify(request.user)}`,
        null,
        this.CONTROLLER_NAME,
      );
      throw new BadRequestException('User authentication required');
    }

    return this.campaignService.create(createCampaignDto, userId);
  }

  @Get()
  @ApiOperation({
    summary: 'Get a collection of paginated campaigns',
    security: [],
  })
  @ApiOkResponse({
    description: 'Campaigns found successfully',
    schema: {
      allOf: [
        { $ref: getSchemaPath(IPaginatedResponse) },
        {
          properties: {
            data: {
              type: 'array',
              items: { $ref: getSchemaPath(Campaign) },
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
    @Query('sort') sort?: string,
    @Query('label') label?: string,
  ) {
    const userId = request.user.keycloakId;

    return this.campaignService.findAllByUser(userId, {
      page,
      offset,
      sort,
      label,
    });
  }

  @IsCreator(CampaignService)
  @Get(':id/groups')
  @ApiOperation({
    summary: "Get a collection of paginated campaigns's groups",
    security: [],
  })
  @ApiOkResponse({
    description: 'Groups found successfully',
    schema: {
      allOf: [
        { $ref: getSchemaPath(IPaginatedResponse) },
        {
          properties: {
            data: {
              type: 'array',
              items: { $ref: getSchemaPath(Group) },
            },
          },
        },
      ],
    },
  })
  async findAllGroups(
    @Req() request,
    @Param('id', ParseMongoIdPipe) id: Types.ObjectId,
    @Query('page', ParseNullableIntPipe) page?: number,
    @Query('offset', ParseNullableIntPipe) offset?: number,
    @Query('sort') sort?: string,
    @Query('label') label?: string,
    @Query('type') type: 'all' | 'active' | 'archived' = 'all',
    @Query('onlyWithMembers') onlyWithMembers?: boolean,
  ) {
    const userId = request.user.keycloakId;

    let checkCampaginId = await this.campaignService.findOne(id);
    if (checkCampaginId.data) {
      return this.groupService.findAllByUser(
        userId,
        { page, offset, sort, label, onlyWithMembers },
        id.toString(),
        type,
      );
    }
  }

  @ApiOperation({ summary: 'Get a campaign by ID' })
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
    description: 'The ID of the campaign to get',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiOkResponse({
    description: 'Campaign found successfully',
    schema: {
      allOf: [
        { $ref: getSchemaPath(IResponse) },
        {
          properties: {
            data: { $ref: getSchemaPath(Campaign) },
          },
        },
      ],
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Campaign #ID not found',
    type: ProblemDetailsDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Error while fetching campaign #ID: Id is not a valid mongoose id',
    type: ProblemDetailsDto,
  })
  @ApiResponse({
    status: 410,
    description: 'Campaign #ID has been deleted',
    type: ProblemDetailsDto,
  })
  @ApiOperation({
    summary: 'Get campaign label by ID (accessible to any session participant)',
  })
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
    description: 'Campaign ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiOkResponse({
    description: 'Campaign label found',
    schema: {
      properties: { data: { properties: { label: { type: 'string' } } } },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Campaign not found',
    type: ProblemDetailsDto,
  })
  @Get(':id/label')
  async findLabel(@Param('id', ParseMongoIdPipe) id: Types.ObjectId) {
    const result = await this.campaignService.findOne(id);
    return { data: { label: result?.data?.label ?? null } };
  }

  @IsCreator(CampaignService)
  @Get(':id')
  async findOne(@Param('id', ParseMongoIdPipe) id: Types.ObjectId) {
    await this.validateResource(id);

    return this.campaignService.findOne(id);
  }

  @IsCreator(CampaignService)
  @ApiOperation({ summary: 'Update a campaign by ID' })
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
    description: 'The ID of the campaign to update',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiOkResponse({
    description: 'Campaign updated successfully',
    schema: {
      allOf: [
        { $ref: getSchemaPath(IResponse) },
        {
          properties: {
            data: { $ref: getSchemaPath(Campaign) },
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
    description: 'Campaign #ID not found',
    type: ProblemDetailsDto,
  })
  @ApiResponse({
    status: 410,
    description: 'Campaign #ID has been deleted',
    type: ProblemDetailsDto,
  })
  @Patch(':id')
  async update(
    @Param('id', ParseMongoIdPipe) id: Types.ObjectId,
    @Body() updateCampaignDto: UpdateCampaignDto,
  ) {
    await this.validateResource(id);

    if (updateCampaignDto.groups) {
      await this.validateGroupRelations(
        updateCampaignDto.groups.active,
        'Active',
      );
      await this.validateGroupRelations(
        updateCampaignDto.groups.archived,
        'Archived',
      );
    }

    return this.campaignService.update(id, updateCampaignDto);
  }

  @IsCreator(CampaignService)
  @ApiOperation({ summary: 'Delete a campaign by ID' })
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
    description: 'The ID of the campaign to delete',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiOkResponse({
    description: 'Campaign #ID deleted',
    schema: {
      allOf: [
        { $ref: getSchemaPath(IResponse) },
        {
          properties: {
            data: { $ref: getSchemaPath(Campaign) },
          },
        },
      ],
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Campaign #ID not found',
    type: ProblemDetailsDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Error while fetching campaign #ID: Id is not a valid mongoose id',
    type: ProblemDetailsDto,
  })
  @ApiResponse({
    status: 410,
    description: 'Campaign #ID has been deleted',
    type: ProblemDetailsDto,
  })
  @Delete(':id')
  async remove(@Param('id', ParseMongoIdPipe) id: Types.ObjectId) {
    await this.validateResource(id);

    return this.campaignService.remove(id);
  }
}
