import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreatePlayerDto } from '@/resources/character/player/dto/create-player.dto';

export class UpdatePlayerDto extends PartialType(
  OmitType(CreatePlayerDto, ['gameSystem'] as const),
) {}
