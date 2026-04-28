import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';

@Schema({ _id: false })
export class Challenge {
  @ApiProperty({ example: 3 })
  @Prop()
  challengeRating?: number;

  @ApiProperty({ example: 700 })
  @Prop()
  experiencePoints?: number;
}

export const ChallengeSchema = SchemaFactory.createForClass(Challenge);
