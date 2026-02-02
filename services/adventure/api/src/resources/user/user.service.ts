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

      const user = await this.userModel.findOne({ keycloakId: id }).exec();
      if (!user) {
        const message = `User #${id} not found`;
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
}
