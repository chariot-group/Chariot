import { Type } from 'class-transformer';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { ActionDto } from '@/resources/character/npc/dto/actions/sub/action.dto';

export class ActionsDto {
  @ValidateNested({ each: true })
  @IsArray()
  @IsOptional()
  @Type(() => ActionDto)
  standard: ActionDto[];

  @ValidateNested({ each: true })
  @IsArray()
  @IsOptional()
  @Type(() => ActionDto)
  legendary: ActionDto[];

  @ValidateNested({ each: true })
  @IsArray()
  @IsOptional()
  @Type(() => ActionDto)
  lair: ActionDto[];
}
