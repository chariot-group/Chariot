import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import mongoose from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { History } from '@/resources/user/schemas/sub/history.schema';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @Prop({ type: mongoose.Schema.Types.ObjectId, auto: true })
  _id: mongoose.Schema.Types.ObjectId;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' })
  @Prop({
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: function (v: string) {
        // Validation UUID v4 (format Keycloak ID)
        return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          v,
        );
      },
      message: (props) => `${props.value} is not a valid Keycloak ID !`,
    },
  })
  keycloakId: string;

  @ApiProperty({ example: 500 })
  @Prop({ required: true, default: 0 })
  balance: number;

  @ApiProperty({ type: [History] })
  @Prop({ type: [History], default: [] })
  history: History[];
}

export const UserSchema = SchemaFactory.createForClass(User);
