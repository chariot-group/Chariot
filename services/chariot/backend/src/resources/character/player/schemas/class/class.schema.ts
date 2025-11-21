import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
export class Class {
  @Prop()
  name?: string;

  @Prop()
  subclass?: string;

  @Prop({ default: 1 })
  level: number;

  @Prop()
  hitDice?: number;
}

export const ClassSchema = SchemaFactory.createForClass(Class);
