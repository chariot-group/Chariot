import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class ValidateCoParticipantDto {
  @ApiProperty({ description: 'Keycloak UUID of the target user to check as a co-participant' })
  @IsUUID()
  targetUserId: string;
}
