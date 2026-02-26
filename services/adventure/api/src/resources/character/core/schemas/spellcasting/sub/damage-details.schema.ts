import { Prop, Schema } from '@nestjs/mongoose';
import { SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';

@Schema({ _id: false })
export class DamageDetails {
  @ApiProperty({ example: 8, description: 'Nombre de dés' })
  @Prop()
  diceCount?: number;

  @ApiProperty({ example: 'd6', description: 'Type de dé', enum: ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'] })
  @Prop()
  diceType?: string;

  @ApiProperty({ example: 3, description: 'Bonus aux dégâts' })
  @Prop()
  bonus?: number;

  @ApiProperty({ example: 'Feu', description: 'Type de dégâts' })
  @Prop()
  damageType?: string;
}

export const DamageDetailsSchema = SchemaFactory.createForClass(DamageDetails);

@Schema({ _id: false })
export class HealingDetails {
  @ApiProperty({ example: 4, description: 'Nombre de dés' })
  @Prop()
  diceCount?: number;

  @ApiProperty({ example: 'd8', description: 'Type de dé', enum: ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'] })
  @Prop()
  diceType?: string;

  @ApiProperty({ example: 3, description: 'Bonus aux soins' })
  @Prop()
  bonus?: number;
}

export const HealingDetailsSchema = SchemaFactory.createForClass(HealingDetails);
