import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
export class Progression {
  @Prop({ default: 1 })
  level: number;

  @Prop({ default: 0 })
  experience: number;
}

export const ProgressionSchema = SchemaFactory.createForClass(Progression);
