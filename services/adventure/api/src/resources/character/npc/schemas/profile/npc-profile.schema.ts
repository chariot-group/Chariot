import { Profile } from '@/resources/character/core/schemas/profile/profile.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';

@Schema({ _id: false })
export class NPCProfile extends Profile {

  @ApiProperty({ example: 'Goblin' })
  @Prop()
  type?: string;

  @ApiProperty({ example: 'Humanoid' })
  @Prop()
  subtype?: string;
}

export const NPCProfileSchema = SchemaFactory.createForClass(NPCProfile);
