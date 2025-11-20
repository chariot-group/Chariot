import { Prop } from '@nestjs/mongoose';
import { Damage } from '@/resources/character/npc/schemas/actions/sub/damage.schema';
import { Schema } from '@nestjs/mongoose';
@Schema({ _id: false })
export class Action {
  @Prop()
  name?: string;

  @Prop()
  type?: string;

  @Prop()
  attackBonus?: number;

  @Prop({ type: Damage, default: {} })
  damage: Damage;

  @Prop()
  range?: string;
}
