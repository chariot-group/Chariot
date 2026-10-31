import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
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

  @ApiProperty({ example: '18d8+54', required: false })
  @Prop({ required: false })
  hitPointsRoll?: string;

  /** @see FR-npc-player-link */
  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    required: false,
    nullable: true,
    description: 'Player character this NPC is linked to (at most one).',
  })
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Character',
    default: null,
    required: false,
  })
  linkedPlayerId?: mongoose.Types.ObjectId | null;
}

export const NPCSchema = SchemaFactory.createForClass(NPC);

NPCSchema.index({ linkedPlayerId: 1, createdBy: 1, deletedAt: 1 });
