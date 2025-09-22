import { Body, Controller, GoneException, Logger, NotFoundException, Param, Patch, Post } from '@nestjs/common';
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
    id: Types.ObjectId,
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
    await this.validateResourceById(id);

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
}
