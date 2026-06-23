import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Character,
  CharacterDocument,
} from '@/resources/character/core/schemas/character.schema';
import { SessionAccessService } from '@/common/session/session-access.service';

@Injectable()
export class MediaAccessService {
  constructor(
    private readonly sessionAccessService: SessionAccessService,
    @InjectModel(Character.name)
    private readonly characterModel: Model<CharacterDocument>,
  ) {}

  async assertCharacterWriteAccess(
    characterId: string,
    requesterId: string,
    authHeader: string | undefined,
    sessionCode?: string,
  ): Promise<CharacterDocument> {
    const character = await this.findActiveCharacter(characterId);

    if (character.createdBy === requesterId) {
      return character;
    }

    const code = sessionCode?.trim();
    if (!code) {
      throw new ForbiddenException(
        'You can only update avatars for your own characters outside of an authorized session',
      );
    }

    await this.sessionAccessService.assertGmEdit(
      authHeader,
      code,
      characterId,
    );

    return character;
  }

  async assertCharacterReadAccess(
    characterId: string,
    requesterId: string,
    authHeader: string | undefined,
    sessionCode?: string,
  ): Promise<CharacterDocument> {
    const character = await this.findActiveCharacter(characterId);

    if (character.createdBy === requesterId) {
      return character;
    }

    const code = sessionCode?.trim();
    if (!code) {
      throw new ForbiddenException(
        'You can only view avatars for your own characters without an active session context',
      );
    }

    await this.sessionAccessService.assertRosterRead(
      authHeader,
      code,
      characterId,
    );

    return character;
  }

  assertUserSelfAccess(
    targetUserId: string,
    requesterId: string,
  ): void {
    if (targetUserId !== requesterId) {
      throw new ForbiddenException(
        'You can only modify your own profile avatar',
      );
    }
  }

  private async findActiveCharacter(
    characterId: string,
  ): Promise<CharacterDocument> {
    if (!Types.ObjectId.isValid(characterId)) {
      throw new NotFoundException(`Character ${characterId} not found`);
    }

    const character = await this.characterModel.findById(characterId).exec();

    if (!character || character.deletedAt) {
      throw new NotFoundException(`Character ${characterId} not found`);
    }

    return character;
  }
}
