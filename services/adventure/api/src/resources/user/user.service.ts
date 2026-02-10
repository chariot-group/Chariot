import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { UserInfoDto } from '@/resources/user/dto/sub/user-info.dto';
import { KeycloakService } from '@/resources/user/keycloak.service';
import { IResponse } from '@/common/dtos/reponse.dto';
import { User, UserDocument } from './schemas/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import UserRepresentation from '@keycloak/keycloak-admin-client/lib/defs/userRepresentation';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  private readonly SERVICE_NAME: string = UserService.name;

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly keycloakService: KeycloakService
  ) { }

  async findOne(id: string): Promise<IResponse<UserInfoDto>> {
    try {
      const start: number = Date.now();
      const keycloakUser: UserRepresentation = await this.keycloakService.getUserById(id);
      if (!keycloakUser) {
        const message: string = `User #${id} not found in Keycloak`;
        this.logger.error(message, null, this.SERVICE_NAME);
        throw new NotFoundException(message);
      }

      let user = await this.userModel.findOne({ keycloakId: id }).exec();
      if (!user) {
        this.logger.debug(`User #${id} not found in database, creating new user`, this.SERVICE_NAME);
        user = await this.userModel.create({ keycloakId: id, balance: 1, history: [] });
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
      };

      const message: string = `User #${id} found in ${end - start}ms`;
      this.logger.verbose(message, this.SERVICE_NAME);

      return {
        message,
        data,
      };
    } catch (error) {
      const message = `Error while fetching user #${id}: ${error.message}`;
      this.logger.error(message, null, this.SERVICE_NAME);
      throw new InternalServerErrorException(message);
    }
  }

  async updateUser(keycloakId: string, updateData: { firstName?: string; lastName?: string; email?: string }): Promise<IResponse<UserInfoDto>> {
    try {
      const start: number = Date.now();

      // Update user in Keycloak
      await this.keycloakService.updateUser(keycloakId, updateData);

      // Fetch updated user data from Keycloak
      const keycloakUser: UserRepresentation = await this.keycloakService.getUserById(keycloakId);
      if (!keycloakUser) {
        const message: string = `User #${keycloakId} not found in Keycloak after update`;
        this.logger.error(message, null, this.SERVICE_NAME);
        throw new NotFoundException(message);
      }

      // Get user from database (for balance and history)
      let user = await this.userModel.findOne({ keycloakId }).exec();
      if (!user) {
        this.logger.debug(`User #${keycloakId} not found in database, creating new user`, this.SERVICE_NAME);
        user = await this.userModel.create({ keycloakId, balance: 1, history: [] });
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
      };

      const message: string = `User #${keycloakId} updated successfully in ${end - start}ms`;
      this.logger.log(message, this.SERVICE_NAME);

      return {
        message,
        data,
      };
    } catch (error) {
      const message = `Error while updating user #${keycloakId}: ${error.message}`;
      this.logger.error(message, error.stack, this.SERVICE_NAME);
      throw new InternalServerErrorException(message);
    }
  }
}
