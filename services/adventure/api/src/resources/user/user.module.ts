import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { KeycloakService } from './keycloak.service';

@Module({
  controllers: [UserController],
  providers: [UserService, KeycloakService],
})
export class UserModule { }
