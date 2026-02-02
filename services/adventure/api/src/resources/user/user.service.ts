import { Injectable, Logger } from '@nestjs/common';
import { UserInfoDto } from '@/resources/user/dto/user-info.dto';
import { KeycloakService } from '@/resources/user/keycloak.service';
import { IResponse } from '@/common/dtos/reponse.dto';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(private readonly keycloakService: KeycloakService) { }

  async findOne(keycloakId: string): Promise<IResponse<UserInfoDto>> {
    this.logger.log(`Fetching user profile from Keycloak for keycloakId: ${keycloakId}`);

    const keycloakUser = await this.keycloakService.getUserById(keycloakId);

    const avatarUrl = keycloakUser.attributes?.avatar?.[0] || null;

    const data: UserInfoDto = {
      keycloakId: keycloakUser.id,
      email: keycloakUser.email,
      username: keycloakUser.username,
      firstName: keycloakUser.firstName,
      lastName: keycloakUser.lastName,
      avatar: avatarUrl,
    };

    const message: string = `User profile for ${keycloakUser.username} retrieved successfully`;
    this.logger.log(message);

    return {
      message,
      data,
    };
  }
}
