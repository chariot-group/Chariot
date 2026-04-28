import { Type } from 'class-transformer';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { ActionDto } from '@/resources/character/npc/dto/actions/sub/action.dto';
import { ApiProperty } from '@nestjs/swagger';

export class ActionsDto {
  @ApiProperty({ type: [ActionDto] })
  @ValidateNested({ each: true })
  @IsArray()
  @IsOptional()
  @Type(() => ActionDto)
  standard: ActionDto[];

  @ApiProperty({ type: [ActionDto] })
  @ValidateNested({ each: true })
  @IsArray()
  @IsOptional()
  @Type(() => ActionDto)
  legendary: ActionDto[];

  @ApiProperty({ type: [ActionDto] })
  @ValidateNested({ each: true })
  @IsArray()
  @IsOptional()
  @Type(() => ActionDto)
  lair: ActionDto[];
}
