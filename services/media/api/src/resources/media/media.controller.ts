import {
  Body,
  Controller,
  Delete,
  Param,
  Post,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { MediaService } from '@/resources/media/media.service';
import { PresignedReadDto } from '@/resources/media/dto/presigned-read.dto';
import { MEDIA_MAX_UPLOAD_BYTES } from '@/resources/media/media.constants';
import { IResponse } from '@/common/dtos/response.dto';

type AuthRequest = {
  user: { keycloakId: string };
  headers: { authorization?: string };
};

@ApiTags('Media')
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('presigned-read')
  @ApiOperation({ summary: 'Batch resolve presigned read URLs for avatars' })
  async presignedRead(
    @Req() req: AuthRequest,
    @Body() body: PresignedReadDto,
  ): Promise<IResponse<Record<string, unknown>>> {
    const urls = await this.mediaService.resolvePresignedReads(
      body.requests,
      req.user.keycloakId,
      req.headers.authorization,
      body.sessionCode,
    );

    return {
      message: 'Presigned URLs resolved',
      data: urls,
    };
  }

  @Post('characters/:id/avatar')
  @ApiOperation({ summary: 'Upload or replace a character avatar' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MEDIA_MAX_UPLOAD_BYTES },
    }),
  )
  async uploadCharacterAvatar(
    @Param('id') characterId: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: AuthRequest,
    @Query('sessionCode') sessionCode?: string,
  ): Promise<IResponse<{ avatar: string }>> {
    const data = await this.mediaService.uploadCharacterAvatar(
      characterId,
      file,
      req.user.keycloakId,
      req.headers.authorization,
      sessionCode,
    );

    return {
      message: 'Character avatar uploaded',
      data,
    };
  }

  @Delete('characters/:id/avatar')
  @ApiOperation({ summary: 'Remove a character avatar' })
  async deleteCharacterAvatar(
    @Param('id') characterId: string,
    @Req() req: AuthRequest,
    @Query('sessionCode') sessionCode?: string,
  ): Promise<IResponse<{ avatar: string }>> {
    const data = await this.mediaService.deleteCharacterAvatar(
      characterId,
      req.user.keycloakId,
      req.headers.authorization,
      sessionCode,
    );

    return {
      message: 'Character avatar removed',
      data,
    };
  }

  @Post('users/me/avatar')
  @ApiOperation({
    summary: 'Upload or replace the current user profile avatar',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MEDIA_MAX_UPLOAD_BYTES },
    }),
  )
  async uploadUserAvatar(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: AuthRequest,
  ): Promise<IResponse<{ avatar: string }>> {
    const data = await this.mediaService.uploadUserAvatar(
      req.user.keycloakId,
      file,
      req.user.keycloakId,
    );

    return {
      message: 'User avatar uploaded',
      data,
    };
  }

  @Delete('users/me/avatar')
  @ApiOperation({ summary: 'Remove the current user profile avatar' })
  async deleteUserAvatar(
    @Req() req: AuthRequest,
  ): Promise<IResponse<{ avatar: string }>> {
    const data = await this.mediaService.deleteUserAvatar(
      req.user.keycloakId,
      req.user.keycloakId,
    );

    return {
      message: 'User avatar removed',
      data,
    };
  }
}
