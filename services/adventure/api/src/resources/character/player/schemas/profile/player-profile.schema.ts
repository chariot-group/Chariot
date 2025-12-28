import { Profile } from '@/resources/character/core/schemas/profile/profile.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
export class PlayerProfile extends Profile {
  @Prop()
  race?: string;

  @Prop()
  subrace?: string;
}

export const PlayerProfileSchema = SchemaFactory.createForClass(PlayerProfile);
