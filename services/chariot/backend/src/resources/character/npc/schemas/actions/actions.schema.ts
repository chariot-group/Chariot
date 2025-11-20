import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Action } from '@/resources/character/npc/schemas/actions/sub/action.schema';

@Schema({ _id: false })
export class Actions {
  @Prop({ type: [Action], default: [] })
  standard: Action[];

  @Prop({ type: [Action], default: [] })
  legendary: Action[];

  @Prop({ type: [Action], default: [] })
  lair: Action[];
}

export const ActionsSchema = SchemaFactory.createForClass(Actions);
