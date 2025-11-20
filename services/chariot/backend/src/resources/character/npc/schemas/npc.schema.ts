import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Actions } from '@/resources/character/npc/schemas/actions/actions.schema';
import { Challenge } from '@/resources/character/npc/schemas/challenge/challenge.schema';
import { NPCProfile } from '@/resources/character/npc/schemas/profile/npc-profile.schema';
import { Character } from '@/resources/character/core/schemas/character.schema';

export type NPCDocument = NPC & Document;

@Schema()
export class NPC extends Character {
  @Prop({ type: Actions, default: {} })
  actions: Actions;

  @Prop({ type: Challenge, default: {} })
  challenge: Challenge;

  @Prop({ type: NPCProfile, default: {} })
  profile?: NPCProfile;
}

export const NPCSchema = SchemaFactory.createForClass(NPC);
