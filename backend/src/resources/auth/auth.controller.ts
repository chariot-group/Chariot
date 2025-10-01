import { Body, Controller, Get, GoneException, Logger, NotAcceptableException, NotFoundException, Param, Patch, Post } from '@nestjs/common';
import { AuthService } from '@/resources/auth/auth.service';
import { SignInDto } from '@/resources/auth/dto/signIn.dto';
import { CreateUserDto } from '@/resources/user/dto/create-user.dto';
import { UserService } from '@/resources/user/user.service';
import { ResetPasswordDto } from '@/resources/auth/dto/resetPassword.dto';
import { changePasswordDto } from '@/resources/auth/dto/changePassword.dto';
import { Public } from '@/common/decorators/public.decorator';
import verifyOTPDto from '@/resources/auth/dto/verifyOTPDto.dto';
import { UserController } from '@/resources/user/user.controller';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '@/resources/user/schemas/user.schema';
import { ParseMongoIdPipe } from '@/common/pipes/parse-mong-id.pipe';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly userController: UserController,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) { }

  private readonly CONTROLLER_NAME = AuthService.name;
  private readonly logger = new Logger(this.CONTROLLER_NAME);

  private async validateResourceByEmail(email: string): Promise<void> {
    const user = await this.userModel.findOne({ email });

    if (!user) {
      const message = `User ${email} not found`;
      this.logger.error(message, null, this.CONTROLLER_NAME);
      throw new NotFoundException(message);
    }

    if (user.deletedAt) {
      const message = `User ${email} deleted`;
      this.logger.error(message, null, this.CONTROLLER_NAME);
      throw new GoneException(message);
    }
  }

  private async validateResourceById(
    id: Types.ObjectId, verifyDate: boolean = false
  ): Promise<void> {
    let user = await this.userModel.findById(id);


    if (!user) {
      const message = `User #${id} not found`;
      this.logger.error(message, null, this.CONTROLLER_NAME);
      throw new NotFoundException(message);
    }

    if (user.deletedAt) {
      const message = `User #${id} deleted`;
      this.logger.error(message, null, this.CONTROLLER_NAME);
      throw new GoneException(message);
    }

    if (verifyDate) {
      const createdAt = new Date(user.createdAt).getTime();
      const updatedAt = new Date(user.updatedAt).getTime();
      const diff = Math.abs(updatedAt - createdAt);
      const tolerance = 1000; // en ms

      if (diff > tolerance) {
        throw new NotAcceptableException();
      }
    }
  }

  @Public()
  @Post('/login')
  login(@Body() signInDto: SignInDto) {
    return this.authService.signIn(signInDto);
  }

  @Public()
  @Post('/register')
  async create(@Body() createUserDto: CreateUserDto) {
    const { campaigns = [] } = createUserDto;
    await this.userController.validateCampaignRelations(campaigns);

    return this.userService.create(createUserDto);
  }

  @Public()
  @Patch(':id/change-password')
  async forgotPassword(
    @Param('id', ParseMongoIdPipe) id: Types.ObjectId,
    @Body() changePassword: changePasswordDto,
  ) {
    this.logger.log(`Change password for user #${id}`, this.CONTROLLER_NAME);
    try {
      await this.validateResourceById(id);
    } catch (error) {
      this.logger.error(error.message, error.stack, this.CONTROLLER_NAME);
      throw error;
    }

    return this.authService.forgotPassword(id, changePassword);
  }

  @Public()
  @Post(':id/verify-otp')
  async verifyOTP(
    @Param('id', ParseMongoIdPipe) id: Types.ObjectId,
    @Body() verifyOTPDto: verifyOTPDto,
  ) {
    await this.validateResourceById(id);

    return this.authService.verifyOTP(id, verifyOTPDto);
  }

  @Public()
  @Patch('/reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    const { email } = resetPasswordDto;
    await this.validateResourceByEmail(email);

    return this.authService.resetPassword(resetPasswordDto);
  }

  @Public()
  @Get(':id')
  async verifyUserIsNew(@Param('id', ParseMongoIdPipe) id: Types.ObjectId) {
    await this.validateResourceById(id, true);

    return this.userService.findOne(id);
  }
}
