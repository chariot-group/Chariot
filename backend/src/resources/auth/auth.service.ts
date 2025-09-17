import { UserService } from '@/resources/user/user.service';
import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { SignInDto } from '@/resources/auth/dto/signIn.dto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { changePasswordDto } from '@/resources/auth/dto/changePassword.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '@/resources/user/schemas/user.schema';
import { MaillingService } from '@/mailling/mailling.service';
import { ResetPasswordDto } from '@/resources/auth/dto/resetPassword.dto';
import verifyOTPDto from '@/resources/auth/dto/verifyOTPDto.dto';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private maillingService: MaillingService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) { }

  private readonly SERVICE_NAME = AuthService.name;
  private readonly logger = new Logger(this.SERVICE_NAME);

  async signIn(signInDto: SignInDto) {
    try {
      const user = await this.userService.findByEmail(signInDto.email);
      if (!user) {
        const message = `Email or password is incorrect`;
        this.logger.error(message, null, this.SERVICE_NAME);
        throw new UnauthorizedException(message);
      }

      const checkPassword = await bcrypt.compare(
        signInDto.password,
        user.password,
      );
      if (!checkPassword) {
        const message = `Email or password is incorrect`;
        this.logger.error(message, null, this.SERVICE_NAME);
        throw new UnauthorizedException(message);
      }

      const start = Date.now();
      const token = this.jwtService.sign({
        iss: process.env.BACKEND_URL,
        sub: user._id,
        aud: process.env.FRONTEND_URL,
      });
      const end = Date.now();

      const message = `User ${signInDto.email} logged in ${end - start}ms`;
      this.logger.verbose(message, this.SERVICE_NAME);
      return {
        message,
        access_token: token,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      const message = `Error while sign in user ${signInDto.email}: ${error.message}`;
      this.logger.error(message, null, this.SERVICE_NAME);
      throw new InternalServerErrorException(message);
    }
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    try {
      const { email, locale } = resetPasswordDto;

      const user = await this.userService.findByEmail(email);

      const otp = Math.floor(100000 + Math.random() * 900000);

      const start: number = Date.now();
      const userUpdate = await this.userModel
        .updateOne({ email: email }, { otp })
        .exec();
      const end: number = Date.now();

      this.maillingService.sendOTP(user.username, user.email, otp, locale);

      if (userUpdate.modifiedCount === 0) {
        const message = `User ${email} not found`;
        this.logger.error(message, null, this.SERVICE_NAME);
        throw new NotFoundException(message);
      }

      const message = `User ${email} update in ${end - start}ms`;
      this.logger.verbose(message, this.SERVICE_NAME);
      return {
        message,
        data: user,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      const message = `Error while reset password of user ${resetPasswordDto.email}: ${error.message}`;
      this.logger.error(message, null, this.SERVICE_NAME);
      throw new InternalServerErrorException(message);
    }
  }

  async forgotPassword(id: Types.ObjectId, changePassword: changePasswordDto) {
    try {
      if (changePassword.newPassword !== changePassword.confirmPassword) {
        const message = `Error while updating user #${id}: Passwords do not match`;
        this.logger.error(message, null, this.SERVICE_NAME);
        throw new BadRequestException(message);
      }

      // Hash the password
      const saltRounds = 10;
      const hashedPassword: string = await bcrypt.hash(
        changePassword.confirmPassword,
        saltRounds,
      );

      const start: number = Date.now();
      const user = await this.userModel
        .updateOne(
          { _id: id },
          {
            password: hashedPassword,
            otp: null,
            updatedAt: new Date(),
          },
        )
        .exec();
      const end: number = Date.now();

      const message = `Password of #${id} update in ${end - start}ms`;
      this.logger.verbose(message, this.SERVICE_NAME);
      return {
        message,
        data: user,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      const message = `Error while changing password of #${id}: ${error.message}`;
      this.logger.error(message, null, this.SERVICE_NAME);
      throw new InternalServerErrorException(message);
    }
  }

  async verifyOTP(id: Types.ObjectId, verifyOTPDto: verifyOTPDto) {
    try {
      const user = await this.userModel.findById(id);

      if (user.otp == null || verifyOTPDto.otp !== user.otp) {
        const message = `Error while updating user #${id}: Otp is incorrect`;
        this.logger.error(message, null, this.SERVICE_NAME);
        throw new UnauthorizedException(message);
      }

      const message = `OTP of #${id} verified`;
      this.logger.verbose(message, this.SERVICE_NAME);
      return {
        message,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      const message = `Error while verifying otp of #${id}: ${error.message}`;
      this.logger.error(message, null, this.SERVICE_NAME);
      throw new InternalServerErrorException(message);
    }
  }
}
