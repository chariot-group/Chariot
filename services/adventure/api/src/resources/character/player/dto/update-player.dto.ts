import { PartialType } from '@nestjs/mapped-types';
import { CreatePlayerDto } from '@/resources/character/player/dto/create-player.dto';
export class UpdatePlayerDto extends PartialType(CreatePlayerDto) {}
