import { Module } from '@nestjs/common';
import { AuthController } from '@/resources/auth/auth.controller';
import { AuthService } from '@/resources/auth/auth.service';
import { UserModule } from '@/resources/user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Algorithm } from 'jsonwebtoken';
import { JwtStrategy } from '@/common/strategies/jwt.strategy';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '@/resources/user/schemas/user.schema';
import { MaillingModule } from '@/mailling/mailling.module';

@Module({
  imports: [
    UserModule,
    MaillingModule,
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    JwtModule.registerAsync({
      imports: [
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
        ConfigModule,
        UserModule,
      ],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        global: true,
        secret: configService.get<string>(
          'JWT_SECRET_KEY',
          'defaultSecretKey',
        ),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRATION', '60s') as any,
          algorithm: configService.get<Algorithm>(
            'JWT_ALGORITHM',
            'HS256',
          ) as Algorithm,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule { }
