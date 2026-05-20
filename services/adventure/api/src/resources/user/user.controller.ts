import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { InternalGuard } from '@/common/guards/internal.guard';
import { Public } from '@/common/decorators/public.decorator';
import { IsString, IsNumber, Min } from 'class-validator';
import {
  ApiExtraModels,
  ApiOperation,
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { UserService } from '@/resources/user/user.service';
import { UserInfoDto } from '@/resources/user/dto/sub/user-info.dto';
import { UpdateUserProfileDto } from '@/resources/user/dto/update-user-profile.dto';
import { IResponse } from '@/common/dtos/reponse.dto';
import { ChangePasswordDto } from '@/resources/user/dto/change-password.dto';
import { AddHistoryDto } from '@/resources/user/dto/add-history.dto';

@ApiExtraModels(
  IResponse,
  UserInfoDto,
  ChangePasswordDto,
  UpdateUserProfileDto,
  AddHistoryDto,
)
@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

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
  @ApiOperation({ summary: 'Get user information by Keycloak ID' })
  @ApiResponse({
    description: 'User information retrieved successfully',
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
  @ApiResponse({ status: 404, description: 'User not found' })
  async findById(@Param('id') id: string) {
    return this.userService.findOne(id);
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

  @Post('internal/tokens')
  @Public()
  @UseGuards(InternalGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Internal: add tokens to a user (service-to-service only)' })
  @ApiResponse({ status: 200, description: 'Tokens added successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden – invalid internal secret' })
  async addTokensInternal(@Body() body: { userId: string; amount: number }) {
    await this.userService.addTokens(body.userId, body.amount);
    return { message: `Added ${body.amount} tokens to user ${body.userId}` };
  }
}
