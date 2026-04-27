import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';

@Schema({ _id: false })
export class Ability {
  @ApiProperty({ example: 'Stealth' })
  @Prop()
  name: string;

  @ApiProperty({ example: 'Allows the character to move unseen and unheard' })
  @Prop()
  description: string;

  @ApiProperty({
    example: true,
    required: false,
    description: "Active l'affichage et le suivi d'un compteur d'utilisations (optionnel, rétrocompatible)",
  })
  @Prop({ required: false })
  hasCounter?: boolean;

  @ApiProperty({
    example: 3,
    required: false,
    description: "Nombre d'utilisations maximum (si hasCounter)",
  })
  @Prop({ required: false })
  counterMax?: number;

  @ApiProperty({
    example: 1,
    required: false,
    description: "Utilisations consommées (si hasCounter)",
  })
  @Prop({ required: false })
  counterCurrent?: number;

  @ApiProperty({
    required: false,
    description:
      'Indique si le compteur se réinitialise après un repos court (métadonnée ; logique de repos non implémentée)',
  })
  @Prop({ required: false })
  counterResetsOnShortRest?: boolean;

  @ApiProperty({
    required: false,
    description:
      'Indique si le compteur se réinitialise après un repos long (métadonnée ; logique de repos non implémentée)',
  })
  @Prop({ required: false })
  counterResetsOnLongRest?: boolean;
}

export const AbilitySchema = SchemaFactory.createForClass(Ability);
