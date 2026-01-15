import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Actions } from '@/resources/character/npc/schemas/actions/actions.schema';
import { Challenge } from '@/resources/character/npc/schemas/challenge/challenge.schema';
import { NPCProfile } from '@/resources/character/npc/schemas/profile/npc-profile.schema';
import { Character } from '@/resources/character/core/schemas/character.schema';
import { ApiProperty } from '@nestjs/swagger';

export type NPCDocument = NPC & Document;

@Schema()
export class NPC extends Character {

  @ApiProperty({ type: Actions })
  @Prop({ type: Actions, default: {} })
  actions: Actions;

  @ApiProperty({ type: Challenge })
  @Prop({ type: Challenge, default: {} })
  challenge: Challenge;

  @ApiProperty({ type: NPCProfile })
  @Prop({ type: NPCProfile, default: {} })
  profile?: NPCProfile;
}

export const NPCSchema = SchemaFactory.createForClass(NPC);
