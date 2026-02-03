import { Prop, Schema } from '@nestjs/mongoose';
import { SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';

@Schema({ _id: false })
export class Background {

  @ApiProperty({ example: 'Born in a small village, raised by farmers.' })
  @Prop()
  personalityTraits?: string;

  @ApiProperty({ example: 'To protect my loved ones at all costs.' })
  @Prop()
  ideals?: string;

  @ApiProperty({ example: 'My family is everything to me.' })
  @Prop()
  bonds?: string;

  @ApiProperty({ example: 'I have a quick temper and a tendency to act before thinking.' })
  @Prop()
  flaws?: string;

  @ApiProperty({ example: 'Member of the Silver Hand organization.' })
  @Prop()
  alliesAndOrgs?: string;

  @ApiProperty({ example: 'Born in a small village, I was trained as a warrior from a young age...' })
  @Prop()
  backstory?: string;
}

export const BackgroundSchema = SchemaFactory.createForClass(Background);
