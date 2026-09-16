import { Module } from '@nestjs/common';
import { NpcService } from '@/resources/character/npc/npc.service';
import { NpcController } from '@/resources/character/npc/npc.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Group, GroupSchema } from '@/resources/group/schemas/group.schema';
import { Character, CharacterSchema } from '../core/schemas/character.schema';
import { CharacterService } from '@/resources/character/character.service';

@Module({
  controllers: [NpcController],
  providers: [NpcService, CharacterService],
  imports: [
    MongooseModule.forFeature([
      { name: Character.name, schema: CharacterSchema },
    ]),
    MongooseModule.forFeature([{ name: Group.name, schema: GroupSchema }]),
  ],
})
export class NpcModule {}
