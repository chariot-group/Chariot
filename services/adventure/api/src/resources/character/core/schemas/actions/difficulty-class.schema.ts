import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';

@Schema({ _id: false })
export class DifficultyClass {

  @ApiProperty({ example: 'wis', description: 'Ability score type for the saving throw' })
  @Prop()
  dcType?: string;

  @ApiProperty({ example: 18, description: 'DC value to beat' })
  @Prop()
  dcValue?: number;

  @ApiProperty({ example: 'none', description: 'Effect on successful save' })
  @Prop()
  successType?: string;
}

export const DifficultyClassSchema = SchemaFactory.createForClass(DifficultyClass);
