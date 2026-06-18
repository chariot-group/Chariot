import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  HttpException,
} from '@nestjs/common';
import { UserInfoDto } from '@/resources/user/dto/sub/user-info.dto';
import { KeycloakService } from '@/resources/user/keycloak.service';
import { IResponse } from '@/common/dtos/reponse.dto';
import { User, UserDocument } from './schemas/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import UserRepresentation from '@keycloak/keycloak-admin-client/lib/defs/userRepresentation';
import { AddHistoryDto } from '@/resources/user/dto/add-history.dto';

export const TOKEN_PURCHASE_CAMPAIGN_NAME = 'Shop';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  private readonly SERVICE_NAME: string = UserService.name;

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly keycloakService: KeycloakService,
  ) {}

  async findOne(id: string): Promise<IResponse<UserInfoDto>> {
    try {
      const start: number = Date.now();
      const keycloakUser: UserRepresentation =
        await this.keycloakService.getUserById(id);
      if (!keycloakUser) {
        const message: string = `User #${id} not found in Keycloak`;
        this.logger.error(message, null, this.SERVICE_NAME);
        throw new NotFoundException(message);
      }

      let user = await this.userModel.findOne({ keycloakId: id }).exec();
      if (!user) {
        this.logger.debug(
          `User #${id} not found in database, creating new user`,
          this.SERVICE_NAME,
        );
        user = await this.userModel.create({
          keycloakId: id,
          balance: 1,
          history: [],
        });
      }
      const end: number = Date.now();

      const data: UserInfoDto = {
        keycloakId: keycloakUser.id,
        email: keycloakUser.email,
        username: keycloakUser.username,
        firstName: keycloakUser.firstName,
        lastName: keycloakUser.lastName,
        avatar: keycloakUser.attributes?.avatar?.[0] || null,
        balance: user.balance,
        history: user.history,
        preferredLocale: user.preferredLocale,
        preferredMeasurementUnit: user.preferredMeasurementUnit,
      };

      const message: string = `User #${id} found in ${end - start}ms`;
      this.logger.verbose(message, this.SERVICE_NAME);

      return {
        message,
        data,
      };
    } catch (error) {
      // Re-throw HTTP exceptions as-is (they already have the correct status code)
      if (error instanceof HttpException) {
        throw error;
      }

      // Only transform unexpected errors into 500
      const message = `Error while fetching user #${id}: ${error.message}`;
      this.logger.error(message, error.stack, this.SERVICE_NAME);
      throw new InternalServerErrorException(message);
    }
  }

  /**
   * Change password for authenticated user
   * @param keycloakId Keycloak user ID
   * @param currentPassword Current password to verify
   * @param newPassword New password to set
   * @throws UnauthorizedException if current password is incorrect
   * @throws ForbiddenException if new password doesn't meet policy
   * @see FR-011: User Password Change
   */
  async changePassword(
    keycloakId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    try {
      const start: number = Date.now();

      // Retrieve user to get username
      const keycloakUser: UserRepresentation =
        await this.keycloakService.getUserById(keycloakId);
      if (!keycloakUser) {
        const message: string = `User #${keycloakId} not found in Keycloak`;
        this.logger.error(message, null, this.SERVICE_NAME);
        throw new NotFoundException(message);
      }

      // Change password via Keycloak
      await this.keycloakService.changeUserPassword(
        keycloakId,
        keycloakUser.username,
        currentPassword,
        newPassword,
      );

      const end: number = Date.now();
      const message: string = `Password changed successfully for user #${keycloakId} in ${end - start}ms`;
      this.logger.log(message, this.SERVICE_NAME);
    } catch (error) {
      const message = `Error while changing password for user #${keycloakId}: ${error.message}`;
      this.logger.error(message, null, this.SERVICE_NAME);
      throw error;
    }
  }

  async updateUser(
    keycloakId: string,
    updateData: {
      firstName?: string;
      lastName?: string;
      email?: string;
      preferredLocale?: string;
      preferredMeasurementUnit?: string;
    },
  ): Promise<IResponse<UserInfoDto>> {
    try {
      const start: number = Date.now();

      const { preferredLocale, preferredMeasurementUnit, ...keycloakUpdateData } = updateData;

      // Update user in Keycloak
      await this.keycloakService.updateUser(keycloakId, keycloakUpdateData);

      // Fetch updated user data from Keycloak
      const keycloakUser: UserRepresentation =
        await this.keycloakService.getUserById(keycloakId);
      if (!keycloakUser) {
        const message: string = `User #${keycloakId} not found in Keycloak after update`;
        this.logger.error(message, null, this.SERVICE_NAME);
        throw new NotFoundException(message);
      }

      // Get user from database (for balance and history)
      let user = await this.userModel.findOne({ keycloakId }).exec();
      if (!user) {
        this.logger.debug(
          `User #${keycloakId} not found in database, creating new user`,
          this.SERVICE_NAME,
        );
        user = await this.userModel.create({
          keycloakId,
          balance: 1,
          history: [],
        });
      }

      if (preferredLocale !== undefined) {
        user.preferredLocale = preferredLocale;
      }
      if (preferredMeasurementUnit !== undefined) {
        user.preferredMeasurementUnit = preferredMeasurementUnit;
      }
      if (preferredLocale !== undefined || preferredMeasurementUnit !== undefined) {
        await user.save();
      }

      const end: number = Date.now();

      const data: UserInfoDto = {
        keycloakId: keycloakUser.id,
        email: keycloakUser.email,
        username: keycloakUser.username,
        firstName: keycloakUser.firstName,
        lastName: keycloakUser.lastName,
        avatar: keycloakUser.attributes?.avatar?.[0] || null,
        balance: user.balance,
        history: user.history,
        preferredLocale: user.preferredLocale,
        preferredMeasurementUnit: user.preferredMeasurementUnit,
      };

      const message: string = `User #${keycloakId} updated successfully in ${end - start}ms`;
      this.logger.log(message, this.SERVICE_NAME);

      return {
        message,
        data,
      };
    } catch (error) {
      // Re-throw HTTP exceptions as-is (they already have the correct status code)
      if (error instanceof HttpException) {
        throw error;
      }

      // Only transform unexpected errors into 500
      const message = `Error while updating user #${keycloakId}: ${error.message}`;
      this.logger.error(message, error.stack, this.SERVICE_NAME);
      throw new InternalServerErrorException(message);
    }
  }

  async addHistory(
    keycloakId: string,
    addHistoryDto: AddHistoryDto,
  ): Promise<IResponse<UserInfoDto>> {
    try {
      const start: number = Date.now();

      let user = await this.userModel.findOne({ keycloakId }).exec();
      if (!user) {
        const message: string = `User #${keycloakId} not found in database`;
        this.logger.error(message, null, this.SERVICE_NAME);
        throw new NotFoundException(message);
      }

      if (addHistoryDto.value > 0 && user.balance < addHistoryDto.value) {
        const message = `Insufficient token balance for user #${keycloakId}`;
        this.logger.warn(message, this.SERVICE_NAME);
        throw new BadRequestException(message);
      }

      user.history.push({
        date: new Date(),
        campaignName: addHistoryDto.campaignName,
        value: addHistoryDto.value,
      });
      user.balance -= addHistoryDto.value;
      await user.save();

      const keycloakUser: UserRepresentation =
        await this.keycloakService.getUserById(keycloakId);
      if (!keycloakUser) {
        const message: string = `User #${keycloakId} not found in Keycloak`;
        this.logger.error(message, null, this.SERVICE_NAME);
        throw new NotFoundException(message);
      }

      const end: number = Date.now();

      const data: UserInfoDto = {
        keycloakId: keycloakUser.id,
        email: keycloakUser.email,
        username: keycloakUser.username,
        firstName: keycloakUser.firstName,
        lastName: keycloakUser.lastName,
        avatar: keycloakUser.attributes?.avatar?.[0] || null,
        balance: user.balance,
        history: user.history,
        preferredLocale: user.preferredLocale,
        preferredMeasurementUnit: user.preferredMeasurementUnit,
      };

      const message: string = `History entry added for user #${keycloakId} in ${end - start}ms`;
      this.logger.log(message, this.SERVICE_NAME);

      return { message, data };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      const message = `Error while adding history for user #${keycloakId}: ${error.message}`;
      this.logger.error(message, error.stack, this.SERVICE_NAME);
      throw new InternalServerErrorException(message);
    }
  }

  async getBalance(keycloakId: string): Promise<number> {
    const user = await this.userModel.findOne({ keycloakId }).exec();
    if (!user) {
      const message: string = `User #${keycloakId} not found in database`;
      this.logger.error(message, null, this.SERVICE_NAME);
      throw new NotFoundException(message);
    }
    return user.balance;
  }

  async addTokens(keycloakId: string, amount: number): Promise<void> {
    try {
      const start: number = Date.now();

      const user = await this.userModel.findOne({ keycloakId }).exec();
      if (!user) {
        const message: string = `User #${keycloakId} not found in database`;
        this.logger.error(message, null, this.SERVICE_NAME);
        throw new NotFoundException(message);
      }

      user.balance += amount;
      user.history.push({
        date: new Date(),
        campaignName: TOKEN_PURCHASE_CAMPAIGN_NAME,
        value: -amount,
      });
      await user.save();

      const end: number = Date.now();
      const message: string = `Added ${amount} tokens to user #${keycloakId} in ${end - start}ms`;
      this.logger.log(message, this.SERVICE_NAME);
    } catch (error) {
      const message = `Error while adding tokens to user #${keycloakId}: ${error.message}`;
      this.logger.error(message, error.stack, this.SERVICE_NAME);
      throw new InternalServerErrorException(message);
    }
  }
}
