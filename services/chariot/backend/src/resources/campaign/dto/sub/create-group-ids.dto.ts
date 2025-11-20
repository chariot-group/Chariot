import { IsArray, IsMongoId } from 'class-validator';

export class CreateGroupIdsDto {
  @IsArray()
  @IsMongoId({ each: true })
  main?: string[];

  @IsArray()
  @IsMongoId({ each: true })
  npc?: string[];

  @IsArray()
  @IsMongoId({ each: true })
  archived?: string[];
}
