import { Prop, Schema } from '@nestjs/mongoose';
import { SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
export class Treasure {
  @Prop({ default: 0 })
  cp: number; // Copper Pieces

  @Prop({ default: 0 })
  sp: number; // Silver Pieces

  @Prop({ default: 0 })
  ep: number; // Electrum Pieces

  @Prop({ default: 0 })
  gp: number; // Gold Pieces

  @Prop({ default: 0 })
  pp: number; // Platinum Pieces

  @Prop()
  notes?: string;
}

export const TreasureSchema = SchemaFactory.createForClass(Treasure);
