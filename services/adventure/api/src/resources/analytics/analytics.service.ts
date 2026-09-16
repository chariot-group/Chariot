/** @see FR-admin-business-kpis: Admin Business KPIs and AARRR Dashboard */
import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '@/resources/user/schemas/user.schema';
import {
  Campaign,
  CampaignDocument,
} from '@/resources/campaign/schemas/campaign.schema';
import {
  Character,
  CharacterDocument,
} from '@/resources/character/core/schemas/character.schema';
import { TOKEN_PURCHASE_CAMPAIGN_NAME } from '@/resources/user/user.service';
import {
  AdventureBusinessAnalytics,
  Period,
} from '@/resources/analytics/analytics.types';
import {
  bucketCounts,
  median,
  resolveDateRange,
  spentGiftNeverBoughtFilter,
  unusedGiftUsersFilter,
} from '@/resources/analytics/analytics.utils';

type LeanUser = {
  keycloakId: string;
  createdAt?: Date;
  balance: number;
  history?: { date: Date; campaignName: string; value: number }[];
};

type LeanCreated = {
  createdBy: string;
  createdAt?: Date;
};

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Campaign.name)
    private readonly campaignModel: Model<CampaignDocument>,
    @InjectModel(Character.name)
    private readonly characterModel: Model<CharacterDocument>,
  ) {}

  async getBusiness(
    period: Period,
    from?: Date,
    to?: Date,
  ): Promise<AdventureBusinessAnalytics> {
    try {
      const start = Date.now();
      const range = resolveDateRange(from, to);

      const [
        acquiredUsers,
        stock,
        sold,
        spent,
        unusedGiftUsers,
        spentGiftNeverBought,
        paidAmongAcquired,
        campaignsCreated,
        firstPlayers,
        firstCampaigns,
      ] = await Promise.all([
        this.userModel
          .find(
            { createdAt: { $gte: range.from, $lte: range.to } },
            { keycloakId: 1, createdAt: 1, history: 1 },
          )
          .lean<LeanUser[]>()
          .exec(),
        this.userModel
          .aggregate<{ total: number }>([
            { $group: { _id: null, total: { $sum: '$balance' } } },
          ])
          .exec(),
        this.userModel
          .aggregate<{ total: number }>([
            { $unwind: '$history' },
            {
              $match: {
                'history.campaignName': TOKEN_PURCHASE_CAMPAIGN_NAME,
                'history.value': { $lt: 0 },
                'history.date': { $gte: range.from, $lte: range.to },
              },
            },
            {
              $group: {
                _id: null,
                total: { $sum: { $multiply: ['$history.value', -1] } },
              },
            },
          ])
          .exec(),
        this.userModel
          .aggregate<{ total: number }>([
            { $unwind: '$history' },
            {
              $match: {
                'history.value': { $gt: 0 },
                'history.date': { $gte: range.from, $lte: range.to },
              },
            },
            { $group: { _id: null, total: { $sum: '$history.value' } } },
          ])
          .exec(),
        this.userModel.countDocuments(unusedGiftUsersFilter()).exec(),
        this.userModel
          .countDocuments(
            spentGiftNeverBoughtFilter(TOKEN_PURCHASE_CAMPAIGN_NAME),
          )
          .exec(),
        this.countPaidAmongAcquired(range.from, range.to),
        this.campaignModel
          .find(
            {
              createdAt: { $gte: range.from, $lte: range.to },
              $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
            },
            { _id: 1, createdBy: 1, createdAt: 1 },
          )
          .lean<Array<LeanCreated & { _id: { toString(): string } }>>()
          .exec(),
        this.characterModel
          .find(
            {
              kind: 'player',
              $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
            },
            { createdBy: 1, createdAt: 1 },
          )
          .lean<LeanCreated[]>()
          .exec(),
        this.campaignModel
          .find(
            {
              $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
            },
            { createdBy: 1, createdAt: 1 },
          )
          .lean<LeanCreated[]>()
          .exec(),
      ]);

      const acquisition = acquiredUsers.length;
      const giftToPaidRate =
        acquisition > 0
          ? Math.round((paidAmongAcquired / acquisition) * 1000) / 10
          : 0;

      const result: AdventureBusinessAnalytics = {
        funnel: {
          acquisition,
          acquisitionOverTime: bucketCounts(
            acquiredUsers
              .map((user) => user.createdAt)
              .filter((date): date is Date => date instanceof Date),
            period,
          ),
        },
        economy: {
          wheelsInCirculation: stock[0]?.total ?? 0,
          wheelsSold: sold[0]?.total ?? 0,
          wheelsSpent: spent[0]?.total ?? 0,
          unusedGiftUsers,
          spentGiftNeverBought,
          blockedUsers: unusedGiftUsers + spentGiftNeverBought,
          giftToPaidRate,
        },
        content: {
          medianHoursToFirstPlayer: this.medianHoursToFirst(
            acquiredUsers,
            firstPlayers,
          ),
          medianHoursToFirstCampaign: this.medianHoursToFirst(
            acquiredUsers,
            firstCampaigns,
          ),
          campaignIdsCreated: campaignsCreated.map((campaign) =>
            campaign._id.toString(),
          ),
        },
      };

      this.logger.debug(
        `Adventure business analytics in ${Date.now() - start}ms`,
      );
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(
        `Error while computing adventure business analytics: ${err.message}`,
        err.stack,
      );
      throw new InternalServerErrorException(
        `Error while computing adventure business analytics: ${err.message}`,
      );
    }
  }

  private async countPaidAmongAcquired(from: Date, to: Date): Promise<number> {
    const paid = await this.userModel
      .countDocuments({
        createdAt: { $gte: from, $lte: to },
        history: {
          $elemMatch: {
            campaignName: TOKEN_PURCHASE_CAMPAIGN_NAME,
            value: { $lt: 0 },
          },
        },
      })
      .exec();
    return paid;
  }

  private medianHoursToFirst(
    acquiredUsers: LeanUser[],
    items: LeanCreated[],
  ): number | null {
    const firstByUser = new Map<string, Date>();
    for (const item of items) {
      if (!item.createdAt) {
        continue;
      }
      const current = firstByUser.get(item.createdBy);
      if (!current || item.createdAt < current) {
        firstByUser.set(item.createdBy, item.createdAt);
      }
    }

    const hours: number[] = [];
    for (const user of acquiredUsers) {
      if (!user.createdAt) {
        continue;
      }
      const first = firstByUser.get(user.keycloakId);
      if (!first || first < user.createdAt) {
        continue;
      }
      hours.push((first.getTime() - user.createdAt.getTime()) / 36e5);
    }
    return median(hours);
  }
}
