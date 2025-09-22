import { Module } from '@nestjs/common';
import { StripeController } from '@/resources/stripe/stripe.controller';
import { StripeService } from '@/resources/stripe/stripe.service';
import { User, UserSchema } from '@/resources/user/schemas/user.schema';
import { UserModule } from '@/resources/user/user.module';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
    ]),
    UserModule
  ],
  controllers: [StripeController],
  providers: [StripeService]
})
export class StripeModule { }
