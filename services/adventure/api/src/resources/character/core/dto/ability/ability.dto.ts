import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsBoolean,
  IsInt,
  Min,
  Validate,
  ValidateIf,
  IsDefined,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { Type } from 'class-transformer';

@ValidatorConstraint({ name: 'abilityCounterMaxVsCurrent', async: false })
export class AbilityCounterMaxVsCurrent implements ValidatorConstraintInterface {
  validate(counterMax: unknown, args: ValidationArguments) {
    const o = args.object as AbilityDto;
    if (!o.hasCounter) return true;
    if (typeof counterMax !== 'number') return false;
    return (o.counterCurrent ?? 0) <= counterMax;
  }
}

export class AbilityDto {
  @ApiProperty({ example: 'Fireball' })
  @IsOptional()
  @IsString()
  name: string;

  @ApiProperty({
    example: 'A powerful fire-based attack that deals area damage',
  })
  @IsOptional()
  @IsString()
  description: string;

  @ApiProperty({ required: false, description: 'Compteur actif (optionnel)' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  hasCounter?: boolean;

  @ApiProperty({ required: false })
  @ValidateIf((o: AbilityDto) => o.hasCounter === true)
  @IsDefined()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Validate(AbilityCounterMaxVsCurrent)
  counterMax?: number;

  @ApiProperty({ required: false })
  @ValidateIf((o: AbilityDto) => o.hasCounter === true)
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  counterCurrent?: number;
}
