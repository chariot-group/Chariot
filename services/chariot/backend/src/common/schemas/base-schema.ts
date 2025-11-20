import { Prop, Schema } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { User } from '@/resources/user/schemas/user.schema';

@Schema()
export class BaseSchema {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: User;

  // Dans ce schema on rajoutera ce qui est commun à chaque schema
  // TODO: Ajouter le champ "deletedAt" ici
}
