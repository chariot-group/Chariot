import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import {
  DamageDetailsDto,
  HealingDetailsDto,
} from '@/resources/character/core/dto/spellcasting/sub/damage-details.dto';
import { wrapSpellDamageDetails } from '@/resources/character/core/utils/spell-damage-details.util';

export class SpellDto {
  @ApiProperty({ example: 'Fireball' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 3 })
  @IsOptional()
  @IsNumber()
  level?: number;

  @ApiProperty({ example: 'Evocation' })
  @IsOptional()
  @IsString()
  school?: string;

  @ApiProperty({
    example:
      'A bright streak flashes from your pointing finger to a point you choose within range...',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: ['V', 'S', 'M'] })
  @IsOptional()
  @IsString({ each: true })
  components?: string[];

  @ApiProperty({ example: '1 action' })
  @IsOptional()
  @IsString()
  castingTime?: string;

  @ApiProperty({ example: 'Instantaneous' })
  @IsOptional()
  @IsString()
  duration?: string;

  @ApiProperty({ example: '150 feet' })
  @IsOptional()
  @IsString()
  range?: string;

  @ApiProperty({ example: 'attack', enum: ['attack', 'heal', 'utility'] })
  @IsOptional()
  @IsString()
  effectType?: 'attack' | 'heal' | 'utility';

  @ApiProperty({ example: '8d6' })
  @IsOptional()
  @IsString()
  damage?: string;

  @ApiProperty({
    type: [DamageDetailsDto],
    example: [
      { diceCount: 8, diceType: 'd6', bonus: 0, damageType: 'fire' },
      { diceCount: 1, diceType: 'd8', bonus: 0, damageType: 'radiant' },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DamageDetailsDto)
  @Transform(({ value }) => wrapSpellDamageDetails(value))
  damageDetails?: DamageDetailsDto[];

  @ApiProperty({ example: '4d8' })
  @IsOptional()
  @IsString()
  healing?: string;

  @ApiProperty({ type: () => HealingDetailsDto })
  @IsOptional()
  @Type(() => HealingDetailsDto)
  healingDetails?: HealingDetailsDto;

  @ApiProperty({
    example: 2,
    nullable: true,
    description: 'NPC only — uses per day. Null means at will.',
  })
  @IsOptional()
  @IsNumber()
  usesPerDay?: number | null;

  @ApiProperty({
    example: 1,
    description: 'NPC only — number of times this spell has been cast today.',
  })
  @IsOptional()
  @IsNumber()
  used?: number;

  @ApiProperty({
    description:
      'Prepared caster (player): level 1+ spells — whether prepared.',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  prepared?: boolean;
}
