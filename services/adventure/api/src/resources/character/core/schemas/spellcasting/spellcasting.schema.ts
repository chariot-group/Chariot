import { Prop, Schema } from '@nestjs/mongoose';
import { SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';
import { Spell } from '@/resources/character/core/schemas/spellcasting/sub/spell.schema';
import { ApiProperty } from '@nestjs/swagger';

@Schema({ _id: false })
export class Spellcasting {

  @ApiProperty({ example: 'Wizard' })
  @Prop()
  className?: string;

  @ApiProperty({ example: 'Intelligence' })
  @Prop()
  ability?: string;

  @ApiProperty({ example: 15 })
  @Prop()
  saveDC?: number;

  @ApiProperty({ example: 7 })
  @Prop()
  attackBonus: number;

  @ApiProperty({ example: { 1: { total: 4, used: 1 }, 2: { total: 3, used: 0 } } })
  @Prop({
    type: Map,
    of: new MongooseSchema(
      {
        total: { type: Number, default: 0 },
        used: { type: Number, default: 0 },
      },
      { _id: false },
    ),
  })
  spellSlotsByLevel?: Map<number, { total?: number; used?: number }>;

  @ApiProperty({ description: 'NPC only — tracker of uses per day keyed by usesPerDay value', example: { 2: 3, 3: null } })
  @Prop({
    type: Map,
    of: Number,
  })
  spellSlotsByUses?: Map<number, number | null>;

  @ApiProperty({ example: false, description: 'Whether spells are innate (grouped by uses per day)', required: false })
  @Prop({ default: false })
  isInnate?: boolean;

  @ApiProperty({ example: 10 })
  @Prop({ default: 0 })
  totalSlots: number;

  @ApiProperty({ type: [Spell] })
  @Prop({ type: [Spell], default: [] })
  spells: Spell[];
}

export const SpellcastingSchema = SchemaFactory.createForClass(Spellcasting);
