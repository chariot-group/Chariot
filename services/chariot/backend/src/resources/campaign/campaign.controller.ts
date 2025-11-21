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
import { Campaign, CampaignDocument } from '@/resources/campaign/schemas/campaign.schema';
import { ParseMongoIdPipe } from '@/common/pipes/parse-mong-id.pipe';

@UseGuards(IsCreatorGuard)
@Controller('campaigns')
export class CampaignController {
  constructor(
    private readonly campaignService: CampaignService,
    private readonly groupService: GroupService,
    @InjectModel(Campaign.name) private campaignModel: Model<CampaignDocument>,
    @InjectModel(Group.name) private groupModel: Model<GroupDocument>,
  ) { }

  private readonly CONTROLLER_NAME = CampaignController.name;
  private readonly logger = new Logger(this.CONTROLLER_NAME);

  private async validateGroupRelations(
    groupIds: string[],
    type: 'Main' | 'NPC' | 'Archived',
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
  async create(@Req() request, @Body() createCampaignDto: CreateCampaignDto) {
    await this.validateGroupRelations(createCampaignDto.groups.main, 'Main');
    await this.validateGroupRelations(createCampaignDto.groups.npc, 'NPC');
    await this.validateGroupRelations(
      createCampaignDto.groups.archived,
      'Archived',
    );

    const userId = request.user.userId;

    return this.campaignService.create(createCampaignDto, userId);
  }

  @Get()
  findAll(
    @Req() request,
    @Query('page', ParseNullableIntPipe) page?: number,
    @Query('offset', ParseNullableIntPipe) offset?: number,
    @Query('sort') sort?: string,
    @Query('label') label?: string,
  ) {
    const userId = request.user.userId;

    return this.campaignService.findAllByUser(userId, {
      page,
      offset,
      sort,
      label,
    });
  }

  @IsCreator(CampaignService)
  @Get(':id/groups')
  async findAllGroups(
    @Req() request,
    @Param('id', ParseMongoIdPipe) id: Types.ObjectId,
    @Query('page', ParseNullableIntPipe) page?: number,
    @Query('offset', ParseNullableIntPipe) offset?: number,
    @Query('sort') sort?: string,
    @Query('label') label?: string,
    @Query('type') type: 'all' | 'main' | 'npc' | 'archived' = 'all',
    @Query('onlyWithMembers') onlyWithMembers?: boolean,
  ) {
    const userId = request.user.userId;

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

  @IsCreator(CampaignService)
  @Get(':id')
  async findOne(@Param('id', ParseMongoIdPipe) id: Types.ObjectId) {
    await this.validateResource(id);

    return this.campaignService.findOne(id);
  }

  @IsCreator(CampaignService)
  @Patch(':id')
  async update(
    @Param('id', ParseMongoIdPipe) id: Types.ObjectId,
    @Body() updateCampaignDto: UpdateCampaignDto,
  ) {
    await this.validateResource(id);

    if (updateCampaignDto.groups) {
      await this.validateGroupRelations(
        updateCampaignDto.groups.main,
        'Main',
      );
      await this.validateGroupRelations(updateCampaignDto.groups.npc, 'NPC');
      await this.validateGroupRelations(
        updateCampaignDto.groups.archived,
        'Archived',
      );
    }

    return this.campaignService.update(id, updateCampaignDto);
  }

  @IsCreator(CampaignService)
  @Delete(':id')
  async remove(@Param('id', ParseMongoIdPipe) id: Types.ObjectId) {
    await this.validateResource(id);

    return this.campaignService.remove(id);
  }
}
