import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';

@Schema({ _id: false })
export class Conditions {

  @ApiProperty({ example: false, description: 'Character is blinded' })
  @Prop({ default: false })
  blinded: boolean;

  @ApiProperty({ example: false, description: 'Character is charmed' })
  @Prop({ default: false })
  charmed: boolean;

  @ApiProperty({ example: false, description: 'Character is deafened' })
  @Prop({ default: false })
  deafened: boolean;

  @ApiProperty({ example: false, description: 'Character is frightened' })
  @Prop({ default: false })
  frightened: boolean;

  @ApiProperty({ example: false, description: 'Character is grappled' })
  @Prop({ default: false })
  grappled: boolean;

  @ApiProperty({ example: false, description: 'Character is incapacitated' })
  @Prop({ default: false })
  incapacitated: boolean;

  @ApiProperty({ example: false, description: 'Character is invisible' })
  @Prop({ default: false })
  invisible: boolean;

  @ApiProperty({ example: false, description: 'Character is paralyzed' })
  @Prop({ default: false })
  paralyzed: boolean;

  @ApiProperty({ example: false, description: 'Character is petrified' })
  @Prop({ default: false })
  petrified: boolean;

  @ApiProperty({ example: false, description: 'Character is poisoned' })
  @Prop({ default: false })
  poisoned: boolean;

  @ApiProperty({ example: false, description: 'Character is prone' })
  @Prop({ default: false })
  prone: boolean;

  @ApiProperty({ example: false, description: 'Character is restrained' })
  @Prop({ default: false })
  restrained: boolean;

  @ApiProperty({ example: false, description: 'Character is stunned' })
  @Prop({ default: false })
  stunned: boolean;

  @ApiProperty({ example: false, description: 'Character is unconscious' })
  @Prop({ default: false })
  unconscious: boolean;
}

export const ConditionsSchema = SchemaFactory.createForClass(Conditions);
