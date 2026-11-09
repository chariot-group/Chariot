import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  QuickLink,
  QuickLinkDocument,
} from '@/resources/quick-link/schemas/quick-link.schema';
import { CreateQuickLinkDto } from '@/resources/quick-link/dto/create-quick-link.dto';
import { UpdateQuickLinkDto } from '@/resources/quick-link/dto/update-quick-link.dto';
import { IResponse } from '@/common/dtos/reponse.dto';

@Injectable()
export class QuickLinkService {
  constructor(
    @InjectModel(QuickLink.name)
    private readonly quickLinkModel: Model<QuickLinkDocument>,
  ) {}

  private readonly logger = new Logger(QuickLinkService.name);
  private readonly SERVICE_NAME = QuickLinkService.name;

  async create(
    dto: CreateQuickLinkDto,
    userId: string,
  ): Promise<IResponse<QuickLink>> {
    try {
      const campaignId = dto.campaignId
        ? new Types.ObjectId(dto.campaignId)
        : null;
      const link = await this.quickLinkModel.create({
        icon: dto.icon,
        url: dto.url,
        label: dto.label,
        campaignId,
        visibleInAllCampaigns: dto.visibleInAllCampaigns ?? false,
        // Player-space links are already visible in the player space.
        visibleInPlayerSpace:
          campaignId !== null && (dto.visibleInPlayerSpace ?? false),
        createdBy: userId,
      });

      this.logger.log(`QuickLink created by ${userId}`, this.SERVICE_NAME);

      return { message: 'Quick link created', data: link };
    } catch (error) {
      const message = `Error creating quick link: ${error.message}`;
      this.logger.error(message, null, this.SERVICE_NAME);
      throw new InternalServerErrorException(message);
    }
  }

  async findAllForUser(
    userId: string,
    campaignId?: string,
  ): Promise<IResponse<QuickLink[]>> {
    try {
      const filter: Record<string, unknown> = {
        createdBy: userId,
        deletedAt: null,
      };

      // A space lists its own links plus the links shared with it.
      if (campaignId === 'null' || campaignId === '') {
        filter.$or = [
          { campaignId: null },
          { campaignId: { $ne: null }, visibleInPlayerSpace: true },
        ];
      } else if (campaignId !== undefined) {
        filter.$or = [
          { campaignId: new Types.ObjectId(campaignId) },
          { visibleInAllCampaigns: true },
        ];
      }

      const links = await this.quickLinkModel.find(filter).exec();

      return { message: 'Quick links found', data: links };
    } catch (error) {
      const message = `Error fetching quick links: ${error.message}`;
      this.logger.error(message, null, this.SERVICE_NAME);
      throw new InternalServerErrorException(message);
    }
  }

  async update(
    id: Types.ObjectId,
    dto: UpdateQuickLinkDto,
    userId: string,
  ): Promise<IResponse<QuickLink>> {
    try {
      const link = await this.quickLinkModel.findById(id).exec();

      if (!link || link.deletedAt) {
        throw new NotFoundException(`Quick link #${id} not found`);
      }

      if (link.createdBy !== userId) {
        throw new ForbiddenException(
          `You are not allowed to update quick link #${id}`,
        );
      }

      if (dto.icon !== undefined) link.icon = dto.icon;
      if (dto.url !== undefined) link.url = dto.url;
      if (dto.label !== undefined) link.label = dto.label;
      if (dto.visibleInAllCampaigns !== undefined) {
        link.visibleInAllCampaigns = dto.visibleInAllCampaigns;
      }
      if (dto.visibleInPlayerSpace !== undefined) {
        link.visibleInPlayerSpace =
          link.campaignId != null && dto.visibleInPlayerSpace;
      }

      await link.save();

      this.logger.log(
        `QuickLink #${id} updated by ${userId}`,
        this.SERVICE_NAME,
      );

      return { message: `Quick link #${id} updated`, data: link };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      const message = `Error updating quick link #${id}: ${error.message}`;
      this.logger.error(message, null, this.SERVICE_NAME);
      throw new InternalServerErrorException(message);
    }
  }

  async remove(
    id: Types.ObjectId,
    userId: string,
  ): Promise<IResponse<QuickLink>> {
    try {
      const link = await this.quickLinkModel.findById(id).exec();

      if (!link || link.deletedAt) {
        throw new NotFoundException(`Quick link #${id} not found`);
      }

      if (link.createdBy !== userId) {
        throw new ForbiddenException(
          `You are not allowed to delete quick link #${id}`,
        );
      }

      link.deletedAt = new Date();
      await link.save();

      this.logger.log(
        `QuickLink #${id} deleted by ${userId}`,
        this.SERVICE_NAME,
      );

      return { message: `Quick link #${id} deleted`, data: link };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      const message = `Error deleting quick link #${id}: ${error.message}`;
      this.logger.error(message, null, this.SERVICE_NAME);
      throw new InternalServerErrorException(message);
    }
  }
}
