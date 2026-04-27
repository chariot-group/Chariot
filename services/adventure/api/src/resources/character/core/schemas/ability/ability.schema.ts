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
    description:
      'Enable display and tracking of a usage counter (optional, backward compatible)',
  })
  @Prop({ required: false })
  hasCounter?: boolean;

  @ApiProperty({
    example: 3,
    required: false,
    description: 'Maximum number of uses (if hasCounter)',
  })
  @Prop({ required: false })
  counterMax?: number;

  @ApiProperty({
    example: 1,
    required: false,
    description: 'Consumed uses (if hasCounter)',
  })
  @Prop({ required: false })
  counterCurrent?: number;

  @ApiProperty({
    required: false,
    description:
      'Indicates whether the counter resets after a short rest (metadata; rest logic not implemented)',
  })
  @Prop({ required: false })
  counterResetsOnShortRest?: boolean;

  @ApiProperty({
    required: false,
    description:
      'Indicates whether the counter resets after a long rest (metadata; rest logic not implemented)',
  })
  @Prop({ required: false })
  counterResetsOnLongRest?: boolean;
}

export const AbilitySchema = SchemaFactory.createForClass(Ability);
