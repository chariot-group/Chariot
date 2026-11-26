import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';

/** User-facing text translated in every Chariot locale (`en` required). */
@Schema({ _id: false })
export class TranslatedLabel {
  @ApiProperty({ example: 'Choose your race' })
  @Prop({ required: true })
  en: string;

  @ApiProperty({ example: 'Choisis ta race', required: false })
  @Prop()
  fr?: string;

  @ApiProperty({ example: 'Elige tu raza', required: false })
  @Prop()
  es?: string;
}

export const TranslatedLabelSchema =
  SchemaFactory.createForClass(TranslatedLabel);
