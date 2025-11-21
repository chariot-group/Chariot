import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Req,
  UseGuards,
  BadRequestException,
  NotFoundException,
  GoneException,
  Logger,
} from '@nestjs/common';
import { GroupService } from '@/resources/group/group.service';
import { CreateGroupDto } from '@/resources/group/dto/create-group.dto';
import { UpdateGroupDto } from '@/resources/group/dto/update-group.dto';
import { ParseNullableIntPipe } from '@/common/pipes/parse-nullable-int.pipe';
import { IsCreatorGuard } from '@/common/guards/is-creator.guard';
import { IsCreator } from '@/common/decorators/is-creator.decorator';
import { CharacterService } from '@/resources/character/character.service';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Group, GroupDocument } from '@/resources/group/schemas/group.schema';
import { Campaign, CampaignDocument } from '@/resources/campaign/schemas/campaign.schema';
import { Character, CharacterDocument } from '@/resources/character/core/schemas/character.schema';
import { ParseMongoIdPipe } from '@/common/pipes/parse-mong-id.pipe';

@UseGuards(IsCreatorGuard)
@Controller('groups')
export class GroupController {
  constructor(
    private readonly groupService: GroupService,
    private readonly characterService: CharacterService,
    @InjectModel(Group.name) private groupModel: Model<GroupDocument>,
    @InjectModel(Campaign.name) private campaignModel: Model<CampaignDocument>,
    @InjectModel(Character.name)
    private characterModel: Model<CharacterDocument>,
  ) { }

  private readonly CONTROLLER_NAME = GroupService.name;
  private readonly logger = new Logger(this.CONTROLLER_NAME);

  private async validateCharacterRelations(
    characterIds: string[],
  ): Promise<void> {
    if (!characterIds || characterIds.length === 0) return;

    for (const characterId of characterIds) {
      if (!Types.ObjectId.isValid(characterId)) {
        throw new BadRequestException(`Invalid character ID: ${characterId}`);
      }

      const character = await this.characterModel.findById(characterId).exec();

      if (!character) {
        throw new NotFoundException(`Character not found: ${characterId}`);
      }

      if (character.deletedAt) {
        throw new GoneException(`Character deleted: ${characterId}`);
      }
    }
  }

  private async validateResource(id: Types.ObjectId): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      const message = `Error while fetching group #${id}: Id is not a valid mongoose id`;
      this.logger.error(message, null, this.CONTROLLER_NAME);
      throw new BadRequestException(message);
    }
    const group = await this.groupModel.findById(id).exec();

    if (!group) {
      const message = `Group #${id} not found`;
      this.logger.error(message, null, this.CONTROLLER_NAME);
      throw new NotFoundException(message);
    }

    if (group.deletedAt) {
      const message = `group #${id} is gone`;
      this.logger.error(message, null, this.CONTROLLER_NAME);
      throw new GoneException(message);
    }
  }

  private async validatecampaignRelations(
    campaignIds: string[],
  ): Promise<void> {
    if (!campaignIds || campaignIds.length === 0) return;

    for (const campaignId of campaignIds) {
      if (!Types.ObjectId.isValid(campaignId)) {
        throw new BadRequestException(`Invalid campaign ID: ${campaignId}`);
      }

      const campaign = await this.campaignModel.findById(campaignId).exec();

      if (!campaign) {
        throw new NotFoundException(`Campaign not found: ${campaignId}`);
      }

      if (campaign.deletedAt) {
        throw new GoneException(`Campaign deleted: ${campaignId}`);
      }
    }
  }

  @Post()
  async create(@Req() request, @Body() createGroupDto: CreateGroupDto) {
    await this.validateCharacterRelations(createGroupDto.characters);
    await this.validatecampaignRelations(
      createGroupDto.campaigns.map((campaign) => campaign.idCampaign),
    );

    const userId = request.user.userId;

    return this.groupService.create(createGroupDto, userId);
  }

  @Get()
  findAll(
    @Req() request,
    @Query('page', ParseNullableIntPipe) page?: number,
    @Query('offset', ParseNullableIntPipe) offset?: number,
    @Query('label') label?: string,
    @Query('sort') sort?: string,
    @Query('onlyWithMembers') onlyWithMembers?: boolean,
  ) {
    const userId = request.user.userId;
    return this.groupService.findAllByUser(userId, {
      page,
      offset,
      label,
      sort,
      onlyWithMembers,
    });
  }

  @IsCreator(GroupService)
  @Get(':id/characters')
  findAllCharacters(
    @Req() request,
    @Param('id', ParseMongoIdPipe) id: Types.ObjectId,
    @Query('page', ParseNullableIntPipe) page?: number,
    @Query('offset', ParseNullableIntPipe) offset?: number,
    @Query('name') name?: string,
    @Query('sort') sort?: string,
  ) {
    const userId = request.user.userId;

    return this.characterService.findAllByUser(
      userId,
      { page, offset, name, sort },
      id.toString(),
    );
  }

  @IsCreator(GroupService)
  @Get(':id')
  async findOne(@Param('id', ParseMongoIdPipe) id: Types.ObjectId) {
    await this.validateResource(id);

    return this.groupService.findOne(id);
  }

  @IsCreator(GroupService)
  @Patch(':id')
  async update(@Param('id', ParseMongoIdPipe) id: Types.ObjectId, @Body() updateGroupDto: UpdateGroupDto) {
    await this.validateResource(id);

    const { characters, campaigns } = updateGroupDto;

    if (characters) {
      await this.validateCharacterRelations(characters);
    }

    if (campaigns) {
      await this.validatecampaignRelations(
        campaigns.map((campaign) => campaign.idCampaign),
      );
    }

    return this.groupService.update(id, updateGroupDto);
  }

  @IsCreator(GroupService)
  @Delete(':id')
  async remove(@Param('id', ParseMongoIdPipe) id: Types.ObjectId) {
    await this.validateResource(id);

    return this.groupService.remove(id);
  }
}
