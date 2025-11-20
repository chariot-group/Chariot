import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  BadRequestException,
  Query,
  Logger,
  NotFoundException,
  GoneException,
} from '@nestjs/common';
import { UserService } from '@/resources/user/user.service';
import { UpdateUserDto } from '@/resources/user/dto/update-user.dto';
import { ParseNullableIntPipe } from '@/common/pipes/parse-nullable-int.pipe';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '@/resources/user/schemas/user.schema';
import { Campaign, CampaignDocument } from '@/resources/campaign/schemas/campaign.schema';
import { ParseMongoIdPipe } from '@/common/pipes/parse-mong-id.pipe';

@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Campaign.name) private campaignModel: Model<CampaignDocument>,
  ) { }

  private readonly CONTROLLER_NAME = UserController.name;
  private readonly logger = new Logger(this.CONTROLLER_NAME);

  private async validateUser(id: Types.ObjectId): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      const message = `Error while validating user #${id}: Id is not a valid mongoose id`;
      this.logger.error(message, null, this.CONTROLLER_NAME);
      throw new BadRequestException(message);
    }

    const user = await this.userModel.findById(id).exec();

    if (!user) {
      const message = `User #${id} not found`;
      this.logger.error(message, null, this.CONTROLLER_NAME);
      throw new NotFoundException(message);
    }

    if (user.deletedAt) {
      const message = `User #${id} is gone`;
      this.logger.error(message, null, this.CONTROLLER_NAME);
      throw new GoneException(message);
    }
  }

  async validateCampaignRelations(campaigns: string[]): Promise<void> {
    const campaignCheckPromises = campaigns.map((campaignId) =>
      this.campaignModel.findById(campaignId).exec(),
    );
    const campaignCheckResults = await Promise.all(campaignCheckPromises);
    const invalidCampaigns = campaignCheckResults.filter(
      (campaign) => !campaign,
    );
    if (invalidCampaigns.length > 0) {
      const invalidCampaignIds = campaigns.filter(
        (_, index) => !campaignCheckResults[index],
      );
      const message = `Invalid campaign IDs: ${invalidCampaignIds.join(', ')}`;
      this.logger.error(message, null, this.CONTROLLER_NAME);
      throw new BadRequestException(message);
    }
    const goneCampaigns = campaignCheckResults.filter(
      (campaign) => campaign.deletedAt !== null,
    );
    if (goneCampaigns.length > 0) {
      const goneCampaignIds = campaigns.filter(
        (_, index) => campaignCheckResults[index].deletedAt !== null,
      );
      const message = `Gone campaign IDs: ${goneCampaignIds.join(', ')}`;
      this.logger.error(message, null, this.CONTROLLER_NAME);
      throw new GoneException(message);
    }
  }

  @Get()
  findAll(
    @Query('page', ParseNullableIntPipe) page?: number,
    @Query('offset', ParseNullableIntPipe) offset?: number,
    @Query('sort') sort?: string,
    @Query('email') email?: string,
  ) {
    return this.userService.findAll({ page, offset, sort, email });
  }

  @Get(':id')
  async findOne(@Param('id', ParseMongoIdPipe) id: Types.ObjectId) {
    await this.validateUser(id);

    return this.userService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id', ParseMongoIdPipe) id: Types.ObjectId, @Body() updateUserDto: UpdateUserDto) {
    await this.validateUser(id);

    const { campaigns = [] } = updateUserDto;

    await this.validateCampaignRelations(campaigns);

    if (!Object.keys(updateUserDto).length) {
      throw new BadRequestException(
        'At least one field must be provided to update a user',
      );
    }
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseMongoIdPipe) id: Types.ObjectId) {
    await this.validateUser(id);

    return this.userService.remove(id);
  }
}
