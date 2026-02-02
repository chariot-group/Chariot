import { Controller, Get, Req } from '@nestjs/common';
import { ApiExtraModels, ApiOperation, ApiResponse, ApiTags, getSchemaPath } from '@nestjs/swagger';
import { UserService } from '@/resources/user/user.service';
import { UserInfoDto } from '@/resources/user/dto/user-info.dto';
import { IResponse } from '@/common/dtos/reponse.dto';

@ApiExtraModels(
  IResponse,
  UserInfoDto
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

}
