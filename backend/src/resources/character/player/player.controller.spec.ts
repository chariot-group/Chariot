import { Test, TestingModule } from '@nestjs/testing';
import { PlayerController } from '@/resources/character/player/player.controller';
import { PlayerService } from '@/resources/character/player/player.service';
import { CharacterService } from '@/resources/character/character.service';
import { Types } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { Character } from '@/resources/character/core/schemas/character.schema';
import { Group } from '@/resources/group/schemas/group.schema';
import { GoneException, NotFoundException, BadRequestException } from '@nestjs/common';

describe('PlayerController - createPlayer', () => {
  let controller: PlayerController;
  let playerService: any;
  let groupModel: any;

  const userId = new Types.ObjectId().toHexString();
  const requestMock = { user: { userId } };

  const createDto = {
    name: 'Test Player',
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
    inspiration: false, // ✅ ajouté
    progression: {
      level: 1,
      experience: 0,
    },
    class: [], // ✅ ajouté (même vide)
    appearance: {
      description: 'A brave warrior',
    },
    background: {
      personalityTraits: '',
      ideals: '',
      bonds: '',
      flaws: '',
    },
    treasure: {
      cp: 0,
      sp: 0,
      ep: 0,
      gp: 0,
      pp: 0,
      notes: '',
    },
    profile: {
      name: 'Test Player',
      race: '',
      subrace: '',
      alignment: '',
      background: '',
      type: '',
      subtype: '',
    },
  };

  beforeEach(async () => {
    playerService = {
      create: jest.fn(),
    };

    groupModel = {
      findById: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue({ _id: new Types.ObjectId(), deletedAt: null }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlayerController],
      providers: [
        { provide: PlayerService, useValue: playerService },
        { provide: CharacterService, useValue: {} },
        {
          provide: getModelToken(Character.name),
          useValue: {}, // not used here
        },
        { provide: getModelToken(Group.name), useValue: groupModel },
      ],
    }).compile();

    controller = module.get<PlayerController>(PlayerController);
  });

  it('should create a player', async () => {
    playerService.create.mockResolvedValue({ data: 'createdPlayer' });

    const result = await controller.createPlayer(requestMock, createDto);

    expect(groupModel.findById).toHaveBeenCalledWith(createDto.groups[0]);
    expect(playerService.create).toHaveBeenCalledWith(createDto, userId);
    expect(result).toEqual({ data: 'createdPlayer' });
  });

  it('should create a player without groups', async () => {
    const createDtoWithoutGroups = { ...createDto, groups: [] };
    playerService.create.mockResolvedValue({ data: 'createdPlayer' });

    const result = await controller.createPlayer(requestMock, createDtoWithoutGroups);

    expect(groupModel.findById).not.toHaveBeenCalled();
    expect(playerService.create).toHaveBeenCalledWith(createDtoWithoutGroups, userId);
    expect(result).toEqual({ data: 'createdPlayer' });
  });

  it('should throw BadRequestException for invalid group ID', async () => {
    const invalidDto = { ...createDto, groups: ['invalid-id'] };

    await expect(
      controller.createPlayer(requestMock, invalidDto),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw NotFoundException if group is not found', async () => {
    groupModel.exec.mockResolvedValue(null);

    await expect(
      controller.createPlayer(requestMock, createDto),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw GoneException if group is soft-deleted', async () => {
    groupModel.exec.mockResolvedValue({ deletedAt: new Date() });

    await expect(
      controller.createPlayer(requestMock, createDto),
    ).rejects.toThrow(GoneException);
  });
});

describe('PlayerController - update', () => {
  let controller: PlayerController;
  let playerService: any;
  let characterModel: any;
  let groupModel: any;

  const playerId = new Types.ObjectId();
  const groupId = new Types.ObjectId().toHexString();

  const updateDto = {
    name: 'Updated Player',
    description: 'Updated description',
    level: 10,
    groups: [groupId],
  };

  beforeEach(async () => {
    playerService = {
      update: jest.fn(),
    };

    characterModel = {
      findById: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue({ _id: playerId, deletedAt: null }),
    };

    groupModel = {
      findById: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue({ _id: groupId, deletedAt: null }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlayerController],
      providers: [
        { provide: PlayerService, useValue: playerService },
        { provide: CharacterService, useValue: {} },
        { provide: getModelToken(Character.name), useValue: characterModel },
        { provide: getModelToken(Group.name), useValue: groupModel },
      ],
    }).compile();

    controller = module.get<PlayerController>(PlayerController);
  });

  it('should update player after validating resource and groups', async () => {
    playerService.update.mockResolvedValue({ data: 'updated' });

    const result = await controller.update(playerId, updateDto);

    expect(characterModel.findById).toHaveBeenCalledWith(playerId);
    expect(groupModel.findById).toHaveBeenCalledWith(groupId);
    expect(playerService.update).toHaveBeenCalledWith(playerId, updateDto);
    expect(result).toEqual({ data: 'updated' });
  });

  it('should update player without groups', async () => {
    const updateDtoWithoutGroups = { ...updateDto, groups: [] };
    playerService.update.mockResolvedValue({ data: 'updated' });

    const result = await controller.update(playerId, updateDtoWithoutGroups);

    expect(characterModel.findById).toHaveBeenCalledWith(playerId);
    expect(groupModel.findById).not.toHaveBeenCalled();
    expect(playerService.update).toHaveBeenCalledWith(playerId, updateDtoWithoutGroups);
    expect(result).toEqual({ data: 'updated' });
  });

  it('should throw BadRequestException for invalid group ID during update', async () => {
    const invalidUpdateDto = { ...updateDto, groups: ['invalid-id'] };

    await expect(
      controller.update(playerId, invalidUpdateDto),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw NotFoundException if group is not found during update', async () => {
    groupModel.exec.mockResolvedValue(null);

    await expect(
      controller.update(playerId, updateDto),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw GoneException if group is soft-deleted during update', async () => {
    groupModel.exec.mockResolvedValue({ deletedAt: new Date() });

    await expect(
      controller.update(playerId, updateDto),
    ).rejects.toThrow(GoneException);
  });
});

describe('PlayerController - validateResource', () => {
  let controller: PlayerController;
  let characterModel: any;

  const validId = new Types.ObjectId();

  beforeEach(async () => {
    characterModel = {
      findById: jest.fn().mockReturnThis(),
      exec: jest.fn(),
    };

    const module = await Test.createTestingModule({
      controllers: [PlayerController],
      providers: [
        { provide: PlayerService, useValue: {} },
        { provide: CharacterService, useValue: {} },
        { provide: getModelToken(Character.name), useValue: characterModel },
        { provide: getModelToken(Group.name), useValue: {} },
      ],
    }).compile();

    controller = module.get(PlayerController);
  });

  it('should throw NotFoundException if player is not found', async () => {
    characterModel.exec.mockResolvedValue(null);

    await expect(
      (controller as any).validateResource(validId),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw GoneException if player is soft-deleted', async () => {
    characterModel.exec.mockResolvedValue({ deletedAt: new Date() });

    await expect(
      (controller as any).validateResource(validId),
    ).rejects.toThrow(GoneException);
  });

  it('should pass silently if player exists and is not deleted', async () => {
    characterModel.exec.mockResolvedValue({ deletedAt: null });

    await expect(
      (controller as any).validateResource(validId),
    ).resolves.toBeUndefined();
  });
});

describe('PlayerController - validateGroupRelations', () => {
  let controller: PlayerController;
  let groupModel: any;

  const validGroupId = new Types.ObjectId().toHexString();

  beforeEach(async () => {
    groupModel = {
      findById: jest.fn().mockReturnThis(),
      exec: jest.fn(),
    };

    const module = await Test.createTestingModule({
      controllers: [PlayerController],
      providers: [
        { provide: PlayerService, useValue: {} },
        { provide: CharacterService, useValue: {} },
        { provide: getModelToken(Character.name), useValue: {} },
        { provide: getModelToken(Group.name), useValue: groupModel },
      ],
    }).compile();

    controller = module.get(PlayerController);
  });

  it('should pass silently if no groups provided', async () => {
    await expect(
      (controller as any).validateGroupRelations([]),
    ).resolves.toBeUndefined();

    await expect(
      (controller as any).validateGroupRelations(null),
    ).resolves.toBeUndefined();
  });

  it('should throw BadRequestException for invalid group ID', async () => {
    await expect(
      (controller as any).validateGroupRelations(['invalid-id']),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw NotFoundException if group is not found', async () => {
    groupModel.exec.mockResolvedValue(null);

    await expect(
      (controller as any).validateGroupRelations([validGroupId]),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw GoneException if group is soft-deleted', async () => {
    groupModel.exec.mockResolvedValue({ deletedAt: new Date() });

    await expect(
      (controller as any).validateGroupRelations([validGroupId]),
    ).rejects.toThrow(GoneException);
  });

  it('should pass silently if all groups exist and are not deleted', async () => {
    groupModel.exec.mockResolvedValue({ deletedAt: null });

    await expect(
      (controller as any).validateGroupRelations([validGroupId]),
    ).resolves.toBeUndefined();
  });

  it('should validate multiple groups', async () => {
    const groupId1 = new Types.ObjectId().toHexString();
    const groupId2 = new Types.ObjectId().toHexString();
    groupModel.exec.mockResolvedValue({ deletedAt: null });

    await expect(
      (controller as any).validateGroupRelations([groupId1, groupId2]),
    ).resolves.toBeUndefined();

    expect(groupModel.findById).toHaveBeenCalledWith(groupId1);
    expect(groupModel.findById).toHaveBeenCalledWith(groupId2);
    expect(groupModel.findById).toHaveBeenCalledTimes(2);
  });
});