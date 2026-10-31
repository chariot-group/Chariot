import { Test, TestingModule } from '@nestjs/testing';
import { NpcController } from '@/resources/character/npc/npc.controller';
import { NpcService } from '@/resources/character/npc/npc.service';
import { SessionAccessService } from '@/common/session/session-access.service';
import { Types } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { Character } from '@/resources/character/core/schemas/character.schema';
import {
  ForbiddenException,
  GoneException,
  NotFoundException,
} from '@nestjs/common';

describe('NpcController - createNpc', () => {
  let controller: NpcController;
  let npcService: any;

  const userId = new Types.ObjectId().toHexString();
  const requestMock = { user: { keycloakId: userId } };

  const createDto = {
    firstname: 'Test NPC',
    groups: [new Types.ObjectId().toHexString()],
    stats: {
      strength: 10,
      dexterity: 12,
      constitution: 14,
      intelligence: 13,
      wisdom: 11,
      charisma: 15,
      size: 'M',
      senses: [],
    },
    affinities: {
      resistances: [],
      immunities: [],
      vulnerabilities: [],
    },
    abilities: [],
    spellcasting: [],
    actions: {
      standard: [],
      legendary: [],
      lair: [],
    },
    challenge: {
      challengeRating: 1,
      experiencePoints: 200,
    },
    profile: {
      alignment: 'True Neutral' as const,
      type: 'humanoid',
      subtype: 'human',
    },
    appearance: {},
    background: {},
    treasure: {},
  };

  beforeEach(async () => {
    npcService = {
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NpcController],
      providers: [
        { provide: NpcService, useValue: npcService },
        {
          provide: SessionAccessService,
          useValue: {
            assertGmCompanionLookup: jest.fn(),
            assertGmEdit: jest.fn(),
          },
        },
        {
          provide: getModelToken(Character.name),
          useValue: {}, // not used here
        },
      ],
    }).compile();

    controller = module.get<NpcController>(NpcController);
  });

  it('should create an NPC', async () => {
    npcService.create.mockResolvedValue({ data: 'createdNpc' });

    const result = await controller.createNpc(requestMock, createDto);

    expect(npcService.create).toHaveBeenCalledWith(createDto, userId);
    expect(result).toEqual({ data: 'createdNpc' });
  });
});

describe('NpcController - update', () => {
  let controller: NpcController;
  let npcService: any;
  let characterModel: any;
  let sessionAccess: {
    assertGmEdit: jest.Mock;
    assertGmCompanionLookup: jest.Mock;
  };

  const npcId = new Types.ObjectId();
  const ownerKeycloakId = 'a3d73edb-5f4c-4e38-9c6b-0c25a58b1234';
  const gmKeycloakId = 'b4e84fec-6f5d-5f49-0d7c-1d36b69c2345';
  const linkedPlayerId = new Types.ObjectId().toHexString();

  const updateDto = {
    firstname: 'Updated NPC',
    description: 'Updated description',
    level: 10,
  };

  beforeEach(async () => {
    npcService = {
      update: jest.fn().mockResolvedValue({ data: 'updated' }),
    };
    sessionAccess = {
      assertGmEdit: jest.fn().mockResolvedValue(undefined),
      assertGmCompanionLookup: jest.fn().mockResolvedValue(undefined),
    };

    characterModel = {
      findById: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      exec: jest
        .fn()
        .mockResolvedValueOnce({ _id: npcId, deletedAt: null })
        .mockResolvedValueOnce({
          createdBy: ownerKeycloakId,
          kind: 'npc',
          linkedPlayerId,
        }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NpcController],
      providers: [
        { provide: NpcService, useValue: npcService },
        { provide: SessionAccessService, useValue: sessionAccess },
        { provide: getModelToken(Character.name), useValue: characterModel },
      ],
    }).compile();

    controller = module.get<NpcController>(NpcController);
  });

  it('should update NPC after validating resource', async () => {
    const requestMock = {
      user: { keycloakId: ownerKeycloakId },
      headers: { authorization: 'Bearer token' },
    };

    const result = await controller.update(
      npcId,
      updateDto,
      requestMock as never,
      undefined,
    );

    expect(characterModel.findById).toHaveBeenCalledWith(npcId);
    expect(npcService.update).toHaveBeenCalledWith(npcId, updateDto);
    expect(sessionAccess.assertGmEdit).not.toHaveBeenCalled();
    expect(result).toEqual({ data: 'updated' });
  });

  it('nominal: session GM gm-edit updates companion NPC character data', async () => {
    const requestMock = {
      user: { keycloakId: gmKeycloakId },
      headers: { authorization: 'Bearer token' },
    };

    const result = await controller.update(
      npcId,
      updateDto,
      requestMock as never,
      'ABC123',
    );

    expect(sessionAccess.assertGmEdit).toHaveBeenCalledWith(
      'Bearer token',
      'ABC123',
      npcId.toString(),
      linkedPlayerId,
    );
    expect(npcService.update).toHaveBeenCalledWith(npcId, updateDto);
    expect(result).toEqual({ data: 'updated' });
  });

  it('failure: session GM gm-edit strips linkedPlayerId', async () => {
    const requestMock = {
      user: { keycloakId: gmKeycloakId },
      headers: { authorization: 'Bearer token' },
    };

    await controller.update(
      npcId,
      { ...updateDto, linkedPlayerId: new Types.ObjectId().toHexString() },
      requestMock as never,
      'ABC123',
    );

    expect(npcService.update).toHaveBeenCalledWith(npcId, updateDto);
    expect(npcService.update.mock.calls[0][1]).not.toHaveProperty(
      'linkedPlayerId',
    );
  });

  it('failure: foreign update without sessionCode is forbidden', async () => {
    const requestMock = {
      user: { keycloakId: gmKeycloakId },
      headers: { authorization: 'Bearer token' },
    };

    await expect(
      controller.update(npcId, updateDto, requestMock as never, undefined),
    ).rejects.toThrow(ForbiddenException);
    expect(npcService.update).not.toHaveBeenCalled();
  });
});

describe('NpcController - validateResource', () => {
  let controller: NpcController;
  let characterModel: any;

  const validId = new Types.ObjectId();

  beforeEach(async () => {
    characterModel = {
      findById: jest.fn().mockReturnThis(),
      exec: jest.fn(),
    };

    const module = await Test.createTestingModule({
      controllers: [NpcController],
      providers: [
        { provide: NpcService, useValue: {} },
        {
          provide: SessionAccessService,
          useValue: {
            assertGmEdit: jest.fn(),
            assertGmCompanionLookup: jest.fn(),
          },
        },
        { provide: getModelToken(Character.name), useValue: characterModel },
      ],
    }).compile();

    controller = module.get(NpcController);
  });

  it('should throw NotFoundException if NPC is not found', async () => {
    characterModel.exec.mockResolvedValue(null);

    await expect((controller as any).validateResource(validId)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should throw GoneException if NPC is soft-deleted', async () => {
    characterModel.exec.mockResolvedValue({ deletedAt: new Date() });

    await expect((controller as any).validateResource(validId)).rejects.toThrow(
      GoneException,
    );
  });

  it('should pass silently if NPC exists and is not deleted', async () => {
    characterModel.exec.mockResolvedValue({ deletedAt: null });

    await expect(
      (controller as any).validateResource(validId),
    ).resolves.toBeUndefined();
  });
});

describe('NpcController - FR-npc-player-link queries', () => {
  let controller: NpcController;
  let npcService: any;
  let sessionAccess: {
    assertGmCompanionLookup: jest.Mock;
    assertGmEdit: jest.Mock;
  };
  const userId = 'a1b2c3d4-e5f6-4a78-8abc-1234567890ab';
  const requestMock = {
    user: { keycloakId: userId },
    headers: { authorization: 'Bearer token' },
  };

  beforeEach(async () => {
    npcService = {
      findUnlinkedNpcsWithoutGroup: jest.fn(),
      findUnlinkedNpcs: jest.fn(),
      findNpcsByLinkedPlayerIds: jest.fn(),
    };
    sessionAccess = {
      assertGmCompanionLookup: jest.fn().mockResolvedValue(undefined),
      assertGmEdit: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NpcController],
      providers: [
        { provide: NpcService, useValue: npcService },
        { provide: SessionAccessService, useValue: sessionAccess },
        { provide: getModelToken(Character.name), useValue: {} },
      ],
    }).compile();

    controller = module.get<NpcController>(NpcController);
  });

  it('nominal: lists unlinked NPCs without group', async () => {
    npcService.findUnlinkedNpcsWithoutGroup.mockResolvedValue({ data: [] });

    await controller.getUnlinkedNpcsWithoutGroup(requestMock, 1, 10);

    expect(npcService.findUnlinkedNpcsWithoutGroup).toHaveBeenCalledWith(
      userId,
      { page: 1, offset: 10, sort: undefined },
    );
  });

  it('edge: lists NPCs by linked player ids', async () => {
    npcService.findNpcsByLinkedPlayerIds.mockResolvedValue({ data: [] });

    await controller.getNpcsByLinkedPlayers(
      requestMock,
      '507f1f77bcf86cd799439011, 507f1f77bcf86cd799439012',
    );

    expect(npcService.findNpcsByLinkedPlayerIds).toHaveBeenCalledWith(userId, [
      '507f1f77bcf86cd799439011',
      '507f1f77bcf86cd799439012',
    ]);
  });

  it('failure: empty playerIds queries an empty list', async () => {
    npcService.findNpcsByLinkedPlayerIds.mockResolvedValue({ data: [] });

    await controller.getNpcsByLinkedPlayers(requestMock, undefined);

    expect(npcService.findNpcsByLinkedPlayerIds).toHaveBeenCalledWith(
      userId,
      [],
    );
  });

  it('nominal: session GM lookup lists companions across owners', async () => {
    npcService.findNpcsByLinkedPlayerIds.mockResolvedValue({ data: [] });
    const playerId = '507f1f77bcf86cd799439011';

    await controller.getNpcsByLinkedPlayers(requestMock, playerId, 'ABC123');

    expect(sessionAccess.assertGmCompanionLookup).toHaveBeenCalledWith(
      'Bearer token',
      'ABC123',
      [playerId],
    );
    expect(npcService.findNpcsByLinkedPlayerIds).toHaveBeenCalledWith(null, [
      playerId,
    ]);
  });
});
