import { Prop, Schema } from '@nestjs/mongoose';
import { SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
export class Profile {
  @Prop()
  alignment?: string;
}

export const ProfileSchema = SchemaFactory.createForClass(Profile);
