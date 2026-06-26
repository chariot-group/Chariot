import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { QuickLinkService } from '@/resources/quick-link/quick-link.service';
import { CreateQuickLinkDto } from '@/resources/quick-link/dto/create-quick-link.dto';
import { UpdateQuickLinkDto } from '@/resources/quick-link/dto/update-quick-link.dto';
import { ParseMongoIdPipe } from '@/common/pipes/parse-mong-id.pipe';
import { Types } from 'mongoose';
import {
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { IResponse } from '@/common/dtos/reponse.dto';
import { QuickLink } from '@/resources/quick-link/schemas/quick-link.schema';
import { ProblemDetailsDto } from '@/common/dtos/errors.dto';

@ApiExtraModels(IResponse, QuickLink)
@Controller('quick-links')
export class QuickLinkController {
  constructor(private readonly quickLinkService: QuickLinkService) {}

  private readonly logger = new Logger(QuickLinkController.name);

  @Post()
  @ApiOperation({ summary: 'Create a quick link' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(IResponse) },
        { properties: { data: { $ref: getSchemaPath(QuickLink) } } },
      ],
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
    type: ProblemDetailsDto,
  })
  create(@Req() request, @Body() dto: CreateQuickLinkDto) {
    const userId = request.user.keycloakId;
    return this.quickLinkService.create(dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get quick links for the authenticated user' })
  @ApiQuery({
    name: 'campaignId',
    required: false,
    description: 'Filter by campaign ID (pass "null" for player space links)',
  })
  findAll(@Req() request, @Query('campaignId') campaignId?: string) {
    const userId = request.user.keycloakId;
    return this.quickLinkService.findAllForUser(userId, campaignId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a quick link' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({
    status: 404,
    description: 'Quick link not found',
    type: ProblemDetailsDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden',
    type: ProblemDetailsDto,
  })
  update(
    @Req() request,
    @Param('id', ParseMongoIdPipe) id: Types.ObjectId,
    @Body() dto: UpdateQuickLinkDto,
  ) {
    const userId = request.user.keycloakId;
    return this.quickLinkService.update(id, dto, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a quick link' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({
    status: 404,
    description: 'Quick link not found',
    type: ProblemDetailsDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden',
    type: ProblemDetailsDto,
  })
  remove(@Req() request, @Param('id', ParseMongoIdPipe) id: Types.ObjectId) {
    const userId = request.user.keycloakId;
    return this.quickLinkService.remove(id, userId);
  }
}
