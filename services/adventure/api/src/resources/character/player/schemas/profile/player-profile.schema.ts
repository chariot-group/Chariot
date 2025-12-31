import { Profile } from '@/resources/character/core/schemas/profile/profile.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';

@Schema({ _id: false })
export class PlayerProfile extends Profile {

  @ApiProperty({ example: 'Elf' })
  @Prop()
  race?: string;

  @ApiProperty({ example: 'High Elf' })
  @Prop()
  subrace?: string;
}

export const PlayerProfileSchema = SchemaFactory.createForClass(PlayerProfile);
