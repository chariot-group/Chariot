import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { DamageDto } from '@/resources/character/npc/dto/actions/sub/damage.dto';
import { DifficultyClassDto } from '@/resources/character/npc/dto/actions/sub/difficulty-class.dto';
import { ApiProperty } from '@nestjs/swagger';

export class ActionDto {

  @ApiProperty({ example: 'Fireball' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 'A ball of fire that explodes upon impact.' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiProperty({ example: 'action', enum: ['action', 'bonus_action', 'reaction'] })
  @IsOptional()
  @IsString()
  usageType?: string;

  @ApiProperty({ example: 'strength', enum: ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'] })
  @IsOptional()
  @IsString()
  attackAbility?: string;

  @ApiProperty({ example: 'The target must succeed on a DC 18 Constitution saving throw or be paralyzed for 1 minute.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 5 })
  @IsOptional()
  @IsNumber()
  attackBonus?: number;

  @ApiProperty({ type: [DamageDto] })
  @ValidateNested({ each: true })
  @IsArray()
  @IsOptional()
  @Type(() => DamageDto)
  damage?: DamageDto[];

  @ApiProperty({ example: '30 feet' })
  @IsOptional()
  @IsString()
  range?: string;

  @ApiProperty({ type: DifficultyClassDto })
  @ValidateNested()
  @IsOptional()
  @Type(() => DifficultyClassDto)
  dc?: DifficultyClassDto;

  @ApiProperty({ example: 2, description: 'Cost of the action (for legendary actions)' })
  @IsOptional()
  @IsNumber()
  cost?: number;
}
