import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Put,
  Req,
} from '@nestjs/common';
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

@ApiExtraModels(IResponse, UserInfoDto, ChangePasswordDto, UpdateUserProfileDto)
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
}
