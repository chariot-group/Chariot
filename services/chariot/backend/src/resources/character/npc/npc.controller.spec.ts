import { Test, TestingModule } from '@nestjs/testing';
import { NpcController } from '@/resources/character/npc/npc.controller';
import { NpcService } from '@/resources/character/npc/npc.service';
import { CharacterService } from '@/resources/character/character.service';
import { Types } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { Character } from '@/resources/character/core/schemas/character.schema';
import { GoneException, NotFoundException } from '@nestjs/common';

describe('NpcController - createNpc', () => {
  let controller: NpcController;
  let npcService: any;

  const userId = new Types.ObjectId().toHexString();
  const requestMock = { user: { userId } };

  const createDto = {
    name: 'Test NPC',
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
      type: 'humanoid',
      subtype: 'human',
    },
  };

  beforeEach(async () => {
    npcService = {
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NpcController],
      providers: [
        { provide: NpcService, useValue: npcService },
        { provide: CharacterService, useValue: {} },
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

  const npcId = new Types.ObjectId();

  const updateDto = {
    name: 'Updated NPC',
    description: 'Updated description',
    level: 10,
  };

  beforeEach(async () => {
    npcService = {
      update: jest.fn(),
    };

    characterModel = {
      findById: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue({ _id: npcId, deletedAt: null }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NpcController],
      providers: [
        { provide: NpcService, useValue: npcService },
        { provide: CharacterService, useValue: {} },
        { provide: getModelToken(Character.name), useValue: characterModel },
      ],
    }).compile();

    controller = module.get<NpcController>(NpcController);
  });

  it('should update NPC after validating resource', async () => {
    npcService.update.mockResolvedValue({ data: 'updated' });

    const result = await controller.update(npcId, updateDto);

    expect(characterModel.findById).toHaveBeenCalledWith(npcId);
    expect(npcService.update).toHaveBeenCalledWith(npcId, updateDto);
    expect(result).toEqual({ data: 'updated' });
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
        { provide: CharacterService, useValue: {} },
        { provide: getModelToken(Character.name), useValue: characterModel },
      ],
    }).compile();

    controller = module.get(NpcController);
  });

  it('should throw NotFoundException if NPC is not found', async () => {
    characterModel.exec.mockResolvedValue(null);

    await expect(
      (controller as any).validateResource(validId),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw GoneException if NPC is soft-deleted', async () => {
    characterModel.exec.mockResolvedValue({ deletedAt: new Date() });

    await expect(
      (controller as any).validateResource(validId),
    ).rejects.toThrow(GoneException);
  });

  it('should pass silently if NPC exists and is not deleted', async () => {
    characterModel.exec.mockResolvedValue({ deletedAt: null });

    await expect(
      (controller as any).validateResource(validId),
    ).resolves.toBeUndefined();
  });
});