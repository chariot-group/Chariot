import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Action } from '@/resources/character/core/schemas/actions/action.schema';
import { ApiProperty } from '@nestjs/swagger';

@Schema({ _id: false })
export class Actions {

  @ApiProperty({ type: [Action] })
  @Prop({ type: [Action], default: [] })
  standard: Action[];

  @ApiProperty({ type: [Action] })
  @Prop({ type: [Action], default: [] })
  legendary: Action[];

  @ApiProperty({ type: [Action] })
  @Prop({ type: [Action], default: [] })
  lair: Action[];
}

export const ActionsSchema = SchemaFactory.createForClass(Actions);
