import { Prop } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';

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
