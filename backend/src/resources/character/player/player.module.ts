import { Module } from '@nestjs/common';
import { PlayerService } from '@/resources/character/player/player.service';
import { PlayerController } from '@/resources/character/player/player.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Group, GroupSchema } from '@/resources/group/schemas/group.schema';
import { CharacterService } from '@/resources/character/character.service';
import {
  Character,
  CharacterSchema,
} from '@/resources/character/core/schemas/character.schema';
import { MetricsModule } from '@/metrics/metrics.module';

@Module({
  controllers: [PlayerController],
  providers: [PlayerService, CharacterService],
  imports: [
    MetricsModule,
    MongooseModule.forFeature([{ name: Group.name, schema: GroupSchema }, { name: Character.name, schema: CharacterSchema }]),
  ],
})
export class PlayerModule { }
