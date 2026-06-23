import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class ValidateGmOwnershipDto {
  @ApiProperty({ description: 'Keycloak UUID of the user to check as session GM' })
  @IsUUID()
  targetUserId: string;
}
