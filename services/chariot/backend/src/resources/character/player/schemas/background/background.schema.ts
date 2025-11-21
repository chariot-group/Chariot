import { Prop, Schema } from '@nestjs/mongoose';
import { SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
export class Background {
  @Prop()
  personalityTraits?: string;

  @Prop()
  ideals?: string;

  @Prop()
  bonds?: string;

  @Prop()
  flaws?: string;

  @Prop()
  alliesAndOrgs?: string;

  @Prop()
  backstory?: string;
}

export const BackgroundSchema = SchemaFactory.createForClass(Background);
