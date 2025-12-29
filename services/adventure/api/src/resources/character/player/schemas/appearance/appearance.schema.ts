import { Prop, Schema } from '@nestjs/mongoose';
import { SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
export class Appearance {
  @Prop()
  age?: number;

  @Prop()
  height?: number;

  @Prop()
  weight?: number;

  @Prop()
  eyes?: string;

  @Prop()
  skin?: string;

  @Prop()
  hair?: string;

  @Prop()
  description?: string;
}

export const AppearanceSchema = SchemaFactory.createForClass(Appearance);
