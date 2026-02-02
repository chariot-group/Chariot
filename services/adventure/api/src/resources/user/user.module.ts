import { Module } from '@nestjs/common';
import { UserService } from '@/resources/user/user.service';
import { UserController } from '@/resources/user/user.controller';
import { KeycloakService } from '@/resources/user/keycloak.service';

@Module({
  controllers: [UserController],
  providers: [UserService, KeycloakService],
})
export class UserModule { }
