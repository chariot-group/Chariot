import {
  Controller,
  Get,
  Param,
  Delete,
  Query,
  Req,
  UseGuards,
  Logger,
  NotFoundException,
  GoneException,
} from '@nestjs/common';
import { CharacterService } from '@/resources/character/character.service';
import { IsCreator } from '@/common/decorators/is-creator.decorator';
import { IsCreatorGuard } from '@/common/guards/is-creator.guard';
import { ParseNullableIntPipe } from '@/common/pipes/parse-nullable-int.pipe';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Character, CharacterDocument } from '@/resources/character/core/schemas/character.schema';
import { ParseMongoIdPipe } from '@/common/pipes/parse-mong-id.pipe';
@UseGuards(IsCreatorGuard)
@Controller('characters')
export class CharacterController {
  constructor(
    private readonly characterService: CharacterService,
    @InjectModel(Character.name)
    private characterModel: Model<CharacterDocument>,
  ) { }

  private readonly CONTROLLER_NAME = CharacterService.name;
  private readonly logger = new Logger(this.CONTROLLER_NAME);

  private async validateResource(id: Types.ObjectId): Promise<void> {
    const character = await this.characterModel.findById(id).exec();

    if (!character) {
      const message = `Character ${id} not found`;
      this.logger.error(message, null, this.CONTROLLER_NAME);
      throw new NotFoundException(message);
    }

    if (character.deletedAt) {
      const message = `Character ${id} is gone`;
      this.logger.error(message, null, this.CONTROLLER_NAME);
      throw new GoneException(message);
    }
  }

  @Get()
  findAll(
    @Req() request,
    @Query('page', ParseNullableIntPipe) page?: number,
    @Query('offset', ParseNullableIntPipe) offset?: number,
    @Query('name') name?: string,
    @Query('sort') sort?: string,
  ) {
    const userId = request.user.userId;
    return this.characterService.findAllByUser(userId, {
      page,
      offset,
      name,
      sort,
    });
  }

  @IsCreator(CharacterService)
  @Get(':id')
  async findOne(@Param('id', ParseMongoIdPipe) id: Types.ObjectId) {
    await this.validateResource(id);

    return this.characterService.findOne(id);
  }

  @IsCreator(CharacterService)
  @Delete(':id')
  async remove(@Param('id', ParseMongoIdPipe) id: Types.ObjectId) {
    await this.validateResource(id);

    return this.characterService.remove(id);
  }
}
