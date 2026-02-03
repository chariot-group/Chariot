import { Prop, Schema } from '@nestjs/mongoose';
import { SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';

@Schema({ _id: false })
export class Treasure {

  @ApiProperty({ example: 0 })
  @Prop({ default: 0 })
  cp: number; // Copper Pieces

  @ApiProperty({ example: 0 })
  @Prop({ default: 0 })
  sp: number; // Silver Pieces

  @ApiProperty({ example: 0 })
  @Prop({ default: 0 })
  ep: number; // Electrum Pieces

  @ApiProperty({ example: 0 })
  @Prop({ default: 0 })
  gp: number; // Gold Pieces

  @ApiProperty({ example: 0 })
  @Prop({ default: 0 })
  pp: number; // Platinum Pieces

  @ApiProperty({ example: 'Some notes about the treasure.' })
  @Prop()
  treasure?: string;

  @ApiProperty({ example: 'Some notes about the equipment.' })
  @Prop()
  equipment?: string;
}

export const TreasureSchema = SchemaFactory.createForClass(Treasure);
