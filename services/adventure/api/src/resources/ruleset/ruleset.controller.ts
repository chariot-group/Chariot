import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { Types } from 'mongoose';
import { RulesetService } from '@/resources/ruleset/ruleset.service';
import { RulesetEntryService } from '@/resources/ruleset/ruleset-entry.service';
import { CreateRulesetDto } from '@/resources/ruleset/dto/create-ruleset.dto';
import { UpdateRulesetDto } from '@/resources/ruleset/dto/update-ruleset.dto';
import {
  CreateRulesetEntryDto,
  FindRulesetEntriesQueryDto,
  UpdateRulesetEntryDto,
} from '@/resources/ruleset/dto/ruleset-entry.dto';
import { FindRulesetsQueryDto } from '@/resources/ruleset/dto/find-rulesets-query.dto';
import { Ruleset } from '@/resources/ruleset/schemas/ruleset.schema';
import { RulesetEntry } from '@/resources/ruleset/schemas/ruleset-entry.schema';
import { ParseMongoIdPipe } from '@/common/pipes/parse-mong-id.pipe';
import { IsAdmin } from '@/common/decorators/is-admin.decorator';
import { hasAdminRole } from '@/common/guards/is-admin.guard';
import { IPaginatedResponse, IResponse } from '@/common/dtos/reponse.dto';
import { ProblemDetailsDto } from '@/common/dtos/errors.dto';

const queryPipe = new ValidationPipe({ transform: true, whitelist: true });

const okResponse = (
  model: typeof Ruleset | typeof RulesetEntry,
  isArray = false,
) =>
  ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(IResponse) },
        {
          properties: {
            data: isArray
              ? { type: 'array', items: { $ref: getSchemaPath(model) } }
              : { $ref: getSchemaPath(model) },
          },
        },
      ],
    },
  });

const notFound = ApiResponse({
  status: 404,
  description: 'Ruleset not found or not visible',
  type: ProblemDetailsDto,
});
const forbidden = ApiResponse({
  status: 403,
  description: 'Admin access required',
  type: ProblemDetailsDto,
});
const conflict = ApiResponse({
  status: 409,
  description: 'Ruleset is not a draft, or duplicate key',
  type: ProblemDetailsDto,
});
const invalid = ApiResponse({
  status: 400,
  description: 'Validation or integrity error',
  type: ProblemDetailsDto,
});

/** @see FR-ruleset-character-builder */
@ApiTags('rulesets')
@ApiExtraModels(IResponse, IPaginatedResponse, Ruleset, RulesetEntry)
@Controller('rulesets')
export class RulesetController {
  constructor(
    private readonly rulesetService: RulesetService,
    private readonly entryService: RulesetEntryService,
  ) {}

  // ── Read (authenticated) ──────────────────────────────────────────────────

  @Get()
  @ApiOperation({
    summary: 'List rulesets (published only for non-admins), without catalog',
  })
  @okResponse(Ruleset, true)
  findAll(@Req() request, @Query() query: FindRulesetsQueryDto) {
    return this.rulesetService.findAll(query, hasAdminRole(request.user));
  }

  @Get('key/:key')
  @ApiOperation({ summary: 'Get the published version of a ruleset by key' })
  @ApiParam({ name: 'key', example: 'dnd5e-2014' })
  @okResponse(Ruleset)
  @notFound
  findByKey(@Param('key') key: string) {
    return this.rulesetService.findPublishedByKey(key);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a ruleset by id with its flow and formulas' })
  @ApiParam({ name: 'id', type: String })
  @okResponse(Ruleset)
  @notFound
  findById(@Req() request, @Param('id', ParseMongoIdPipe) id: Types.ObjectId) {
    return this.rulesetService.findById(id, hasAdminRole(request.user));
  }

  @Get(':id/entries')
  @ApiOperation({ summary: 'List catalog entries of a ruleset (paginated)' })
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(IPaginatedResponse) },
        {
          properties: {
            data: {
              type: 'array',
              items: { $ref: getSchemaPath(RulesetEntry) },
            },
          },
        },
      ],
    },
  })
  @notFound
  findEntries(
    @Req() request,
    @Param('id', ParseMongoIdPipe) id: Types.ObjectId,
    @Query(queryPipe) query: FindRulesetEntriesQueryDto,
  ) {
    return this.entryService.findAll(id, query, hasAdminRole(request.user));
  }

  // ── Admin write ───────────────────────────────────────────────────────────

  @Post()
  @IsAdmin()
  @ApiOperation({ summary: 'Create version 1 of a ruleset as a draft (admin)' })
  @okResponse(Ruleset)
  @invalid
  @forbidden
  @conflict
  create(@Req() request, @Body() dto: CreateRulesetDto) {
    return this.rulesetService.create(dto, request.user.keycloakId);
  }

  @Patch(':id')
  @IsAdmin()
  @ApiOperation({ summary: 'Update a draft ruleset (admin)' })
  @ApiParam({ name: 'id', type: String })
  @okResponse(Ruleset)
  @invalid
  @forbidden
  @notFound
  @conflict
  update(
    @Param('id', ParseMongoIdPipe) id: Types.ObjectId,
    @Body() dto: UpdateRulesetDto,
  ) {
    return this.rulesetService.update(id, dto);
  }

  @Delete(':id')
  @IsAdmin()
  @ApiOperation({ summary: 'Delete a draft ruleset and its entries (admin)' })
  @ApiParam({ name: 'id', type: String })
  @okResponse(Ruleset)
  @forbidden
  @notFound
  @conflict
  remove(@Param('id', ParseMongoIdPipe) id: Types.ObjectId) {
    return this.rulesetService.remove(id);
  }

  @Post(':id/publish')
  @IsAdmin()
  @ApiOperation({
    summary:
      'Publish a draft; the previously published version of the key is archived (admin)',
  })
  @ApiParam({ name: 'id', type: String })
  @okResponse(Ruleset)
  @invalid
  @forbidden
  @notFound
  @conflict
  publish(@Param('id', ParseMongoIdPipe) id: Types.ObjectId) {
    return this.rulesetService.publish(id);
  }

  @Post(':id/archive')
  @IsAdmin()
  @ApiOperation({ summary: 'Archive a published ruleset (admin)' })
  @ApiParam({ name: 'id', type: String })
  @okResponse(Ruleset)
  @forbidden
  @notFound
  @conflict
  archive(@Param('id', ParseMongoIdPipe) id: Types.ObjectId) {
    return this.rulesetService.archive(id);
  }

  @Post(':id/versions')
  @IsAdmin()
  @ApiOperation({
    summary: 'Copy a ruleset and its entries into a new draft version (admin)',
  })
  @ApiParam({ name: 'id', type: String })
  @okResponse(Ruleset)
  @forbidden
  @notFound
  createVersion(
    @Req() request,
    @Param('id', ParseMongoIdPipe) id: Types.ObjectId,
  ) {
    return this.rulesetService.createVersion(id, request.user.keycloakId);
  }

  @Post(':id/entries')
  @IsAdmin()
  @ApiOperation({ summary: 'Add a catalog entry to a draft ruleset (admin)' })
  @ApiParam({ name: 'id', type: String })
  @okResponse(RulesetEntry)
  @invalid
  @forbidden
  @notFound
  @conflict
  createEntry(
    @Req() request,
    @Param('id', ParseMongoIdPipe) id: Types.ObjectId,
    @Body() dto: CreateRulesetEntryDto,
  ) {
    return this.entryService.create(id, dto, request.user.keycloakId);
  }

  @Patch(':id/entries/:entryId')
  @IsAdmin()
  @ApiOperation({ summary: 'Update an entry of a draft ruleset (admin)' })
  @ApiParam({ name: 'id', type: String })
  @ApiParam({ name: 'entryId', type: String })
  @okResponse(RulesetEntry)
  @invalid
  @forbidden
  @notFound
  @conflict
  updateEntry(
    @Param('id', ParseMongoIdPipe) id: Types.ObjectId,
    @Param('entryId', ParseMongoIdPipe) entryId: Types.ObjectId,
    @Body() dto: UpdateRulesetEntryDto,
  ) {
    return this.entryService.update(id, entryId, dto);
  }

  @Delete(':id/entries/:entryId')
  @IsAdmin()
  @ApiOperation({ summary: 'Delete an entry of a draft ruleset (admin)' })
  @ApiParam({ name: 'id', type: String })
  @ApiParam({ name: 'entryId', type: String })
  @okResponse(RulesetEntry)
  @forbidden
  @notFound
  @conflict
  removeEntry(
    @Param('id', ParseMongoIdPipe) id: Types.ObjectId,
    @Param('entryId', ParseMongoIdPipe) entryId: Types.ObjectId,
  ) {
    return this.entryService.remove(id, entryId);
  }
}
