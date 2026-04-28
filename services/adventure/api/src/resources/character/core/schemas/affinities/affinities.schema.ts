import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';

@Schema({ _id: false })
export class Affinities {
  @ApiProperty({ example: ['Fire', 'Water'] })
  @Prop({ type: [String], default: [] })
  resistances: string[];

  @ApiProperty({ example: ['Ice', 'Poison'] })
  @Prop({ type: [String], default: [] })
  immunities: string[];

  @ApiProperty({ example: ['Earth', 'Lightning'] })
  @Prop({ type: [String], default: [] })
  vulnerabilities: string[];
}

export const AffinitiesSchema = SchemaFactory.createForClass(Affinities);
