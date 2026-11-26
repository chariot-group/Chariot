import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import mongoose from 'mongoose';

@Schema({ _id: false })
export class RulesetFormula {
  @ApiProperty({ example: 'dexModifier' })
  @Prop({ required: true })
  id: string;

  @ApiProperty({
    example: { '-': [{ var: 'state.abilities.dex' }, 10] },
    description: 'JSON Logic',
  })
  @Prop({ type: mongoose.Schema.Types.Mixed, required: true })
  expression: unknown;
}

export const RulesetFormulaSchema =
  SchemaFactory.createForClass(RulesetFormula);

@Schema({ _id: false })
export class RulesetProjection {
  @ApiProperty({
    example: { var: 'state.abilities.dex' },
    description: 'JSON Logic',
  })
  @Prop({ type: mongoose.Schema.Types.Mixed, required: true })
  source: unknown;

  @ApiProperty({ example: 'stats.abilityScores.dex' })
  @Prop({ required: true })
  target: string;
}

export const RulesetProjectionSchema =
  SchemaFactory.createForClass(RulesetProjection);
