import { Type } from 'class-transformer';
import { IsOptional, ValidateNested, IsString } from 'class-validator';
import { ActionsDto } from '@/resources/character/npc/dto/actions/actions.dto';
import { ChallengeDto } from '@/resources/character/npc/dto/challenge/challenge.dto';
import { CreateCharacterDto } from '@/resources/character/core/dto/create-character.dto';
import { NPCProfileDto } from '@/resources/character/npc/dto/profile/npc-profile.dto';
import { ApiProperty } from '@nestjs/swagger';

export class CreateNpcDto extends CreateCharacterDto {
  @ApiProperty({ type: ActionsDto })
  @ValidateNested({ each: true })
  @IsOptional()
  @Type(() => ActionsDto)
  actions: ActionsDto;

  @ApiProperty({ type: ChallengeDto })
  @ValidateNested()
  @IsOptional()
  @Type(() => ChallengeDto)
  challenge: ChallengeDto;

  @ApiProperty({ type: NPCProfileDto })
  @ValidateNested()
  @IsOptional()
  @Type(() => NPCProfileDto)
  profile: NPCProfileDto;

  @ApiProperty({ example: '18d8+54', required: false })
  @IsString()
  @IsOptional()
  hitPointsRoll?: string;
}
