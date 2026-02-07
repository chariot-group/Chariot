import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';

@Schema({ _id: false })
export class DeathSaves {
  @ApiProperty({
    example: 0,
    description: 'Number of successful death saving throws (0-3)',
    minimum: 0,
    maximum: 3,
  })
  @Prop({ default: 0, min: 0, max: 3 })
  successes: number;

  @ApiProperty({
    example: 0,
    description: 'Number of failed death saving throws (0-3). Three failures means death.',
    minimum: 0,
    maximum: 3,
  })
  @Prop({ default: 0, min: 0, max: 3 })
  failures: number;
}

export const DeathSavesSchema = SchemaFactory.createForClass(DeathSaves);
