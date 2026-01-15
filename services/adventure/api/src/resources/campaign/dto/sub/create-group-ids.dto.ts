import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsMongoId } from 'class-validator';

export class CreateGroupIdsDto {

  @ApiProperty({ example: ["60d21b4667d0d8992e610c85"] })
  @IsArray()
  @IsMongoId({ each: true })
  main?: string[];

  @ApiProperty({ example: ["60d21b4667d0d8992e610c86"] })
  @IsArray()
  @IsMongoId({ each: true })
  npc?: string[];

  @ApiProperty({ example: [] })
  @IsArray()
  @IsMongoId({ each: true })
  archived?: string[];
}
