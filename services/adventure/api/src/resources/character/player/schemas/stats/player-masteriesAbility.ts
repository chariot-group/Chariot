import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';

@Schema({ _id: false })
export class MasteriesAbility {
  @ApiProperty({ example: true })
  @Prop({ default: false })
  strength: boolean;

  @ApiProperty({ example: true })
  @Prop({ default: false })
  dexterity: boolean;

  @ApiProperty({ example: true })
  @Prop({ default: false })
  constitution: boolean;

  @ApiProperty({ example: true })
  @Prop({ default: false })
  intelligence: boolean;

  @ApiProperty({ example: true })
  @Prop({ default: false })
  wisdom: boolean;

  @ApiProperty({ example: true })
  @Prop({ default: false })
  charisma: boolean;
}

export const MasteriesAbilitySchema =
  SchemaFactory.createForClass(MasteriesAbility);
