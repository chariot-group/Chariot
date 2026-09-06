import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateCharacterDto } from '@/resources/character/core/dto/create-character.dto';

export class UpdateCharacterDto extends PartialType(
  OmitType(CreateCharacterDto, ['gameSystem'] as const),
) {}
