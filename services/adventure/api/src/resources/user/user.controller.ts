import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { InternalGuard } from '@/common/guards/internal.guard';
import { Public } from '@/common/decorators/public.decorator';
import {
  ApiExtraModels,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { UserService } from '@/resources/user/user.service';
import { UserInfoDto } from '@/resources/user/dto/sub/user-info.dto';
import { PublicUserInfoDto } from '@/resources/user/dto/sub/public-user-info.dto';
import { UpdateUserProfileDto } from '@/resources/user/dto/update-user-profile.dto';
import { IResponse } from '@/common/dtos/reponse.dto';
import { ChangePasswordDto } from '@/resources/user/dto/change-password.dto';
import { AddHistoryDto } from '@/resources/user/dto/add-history.dto';
import { SessionAccessService } from '@/common/session/session-access.service';

@ApiExtraModels(
  IResponse,
  UserInfoDto,
  PublicUserInfoDto,
  ChangePasswordDto,
  UpdateUserProfileDto,
  AddHistoryDto,
)
@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly sessionAccessService: SessionAccessService,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current authenticated user information' })
  @ApiResponse({
    description: 'User information retrieved successfully',
    schema: {
      allOf: [
        { $ref: getSchemaPath(IResponse) },
        {
          properties: {
            data: {
              $ref: getSchemaPath(UserInfoDto),
            },
          },
        },
      ],
    },
  })
  @ApiResponse({
    status: 401,
    description: 'User not authenticated',
  })
  async findOne(@Req() request) {
    return this.userService.findOne(request.user.keycloakId);
  }

  @Get(':id')
  @ApiOperation({
    summary:
      "Get another user's public profile by Keycloak ID (display fields only — never email, balance or history). Requires that the caller and the target share an active session (sessionCode), unless looking up one's own id. See FR-user-public-profile-read-access.",
  })
  @ApiQuery({
    name: 'sessionCode',
    required: false,
    description:
      'OTP code of a session the caller and the target both participate in. Required unless id is the caller’s own keycloakId.',
  })
  @ApiResponse({
    description: 'Public user profile retrieved successfully',
    schema: {
      allOf: [
        { $ref: getSchemaPath(IResponse) },
        {
          properties: {
            data: { $ref: getSchemaPath(PublicUserInfoDto) },
          },
        },
      ],
    },
  })
  @ApiResponse({
    status: 403,
    description:
      'Missing sessionCode, or caller/target are not both participants of that session',
  })
  @ApiResponse({ status: 404, description: 'User or session not found' })
  async findById(
    @Param('id') id: string,
    @Req()
    request: {
      user: { keycloakId: string };
      headers: { authorization?: string };
    },
    @Query('sessionCode') sessionCode?: string | string[],
  ) {
    const requesterId = request.user.keycloakId;

    if (requesterId !== id) {
      // Un paramètre dupliqué (?sessionCode=a&sessionCode=b) arrive sous forme de tableau.
      const code =
        typeof sessionCode === 'string' ? sessionCode.trim() : undefined;
      if (!code) {
        throw new ForbiddenException(
          'A sessionCode shared with the target user is required to view another user’s profile',
        );
      }
      await this.sessionAccessService.assertUserCoParticipant(
        request.headers.authorization,
        code,
        id,
      );
    }

    return this.userService.findPublicProfile(id);
  }

  @Put('me/password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change password for current authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully',
    schema: {
      allOf: [
        { $ref: getSchemaPath(IResponse) },
        {
          properties: {
            message: {
              type: 'string',
              example: 'Password changed successfully',
            },
          },
        },
      ],
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input - validation failed',
  })
  @ApiResponse({
    status: 401,
    description: 'Current password is incorrect',
  })
  @ApiResponse({
    status: 403,
    description: 'New password does not meet complexity requirements',
  })
  @ApiResponse({
    status: 500,
    description: 'Keycloak API error',
  })
  async changePassword(
    @Req() request,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    await this.userService.changePassword(
      request.user.keycloakId,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
    );

    return {
      message: 'Password changed successfully',
    };
  }

  @Put('me/history')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Add a history entry for the current authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'History entry added successfully',
    schema: {
      allOf: [
        { $ref: getSchemaPath(IResponse) },
        {
          properties: {
            data: { $ref: getSchemaPath(UserInfoDto) },
          },
        },
      ],
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'User not authenticated' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async addHistory(@Req() request, @Body() addHistoryDto: AddHistoryDto) {
    return this.userService.addHistory(request.user.keycloakId, addHistoryDto);
  }

  @Put('me')
  @ApiOperation({ summary: 'Update current authenticated user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile updated successfully',
    schema: {
      allOf: [
        { $ref: getSchemaPath(IResponse) },
        {
          properties: {
            data: {
              $ref: getSchemaPath(UserInfoDto),
            },
          },
        },
      ],
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: 401,
    description: 'User not authenticated',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found in Keycloak',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error or Keycloak communication failure',
  })
  async updateProfile(
    @Req() request,
    @Body() updateUserProfileDto: UpdateUserProfileDto,
  ) {
    return this.userService.updateUser(
      request.user.keycloakId,
      updateUserProfileDto,
    );
  }

  @Get('internal/:userId/balance')
  @Public()
  @UseGuards(InternalGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Internal: get token balance for a user (service-to-service only)',
  })
  @ApiResponse({ status: 200, description: 'Balance retrieved successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden – invalid internal secret',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getBalanceInternal(@Param('userId') userId: string) {
    const balance = await this.userService.getBalance(userId);
    return { balance };
  }

  @Post('internal/tokens')
  @Public()
  @UseGuards(InternalGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Internal: add tokens to a user (service-to-service only)',
  })
  @ApiResponse({ status: 200, description: 'Tokens added successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden – invalid internal secret',
  })
  async addTokensInternal(@Body() body: { userId: string; amount: number }) {
    await this.userService.addTokens(body.userId, body.amount);
    return { message: `Added ${body.amount} tokens to user ${body.userId}` };
  }

  @Get('internal/:keycloakId/avatar')
  @Public()
  @UseGuards(InternalGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Internal: get user avatar attribute for media service',
  })
  async getUserAvatarInternal(
    @Param('keycloakId') keycloakId: string,
  ): Promise<{ avatar: string | null }> {
    const avatar = await this.userService.getUserAvatar(keycloakId);
    return { avatar };
  }

  @Patch('internal/:keycloakId/avatar')
  @Public()
  @UseGuards(InternalGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Internal: update user avatar attribute for media service',
  })
  async updateUserAvatarInternal(
    @Param('keycloakId') keycloakId: string,
    @Body() body: { avatar: string },
  ): Promise<{ avatar: string }> {
    await this.userService.updateUserAvatar(keycloakId, body.avatar);
    return { avatar: body.avatar };
  }
}
