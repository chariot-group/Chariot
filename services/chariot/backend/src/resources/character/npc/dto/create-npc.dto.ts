import { Type } from 'class-transformer';
import { IsOptional, ValidateNested } from 'class-validator';
import { ActionsDto } from '@/resources/character/npc/dto/actions/actions.dto';
import { ChallengeDto } from '@/resources/character/npc/dto/challenge/challenge.dto';
import { CreateCharacterDto } from '@/resources/character/core/dto/create-character.dto';
import { NPCProfileDto } from '@/resources/character/npc/dto/profile/npc-profile.dto';

export class CreateNpcDto extends CreateCharacterDto {
  @ValidateNested({ each: true })
  @IsOptional()
  @Type(() => ActionsDto)
  actions: ActionsDto;

  @ValidateNested()
  @IsOptional()
  @Type(() => ChallengeDto)
  challenge: ChallengeDto;

  @ValidateNested()
  @IsOptional()
  @Type(() => NPCProfileDto)
  profile: NPCProfileDto;
}
