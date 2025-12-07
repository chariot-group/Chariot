import { Module } from '@nestjs/common';
import { KeycloakStrategy } from '@/common/strategies/keycloak.strategy';

@Module({
  imports: [],
  providers: [KeycloakStrategy],
  exports: [KeycloakStrategy],
})
export class AuthModule { }
