import { Test, TestingModule } from '@nestjs/testing';
import { CharacterController } from '@/resources/character/character.controller';
import { CharacterService } from '@/resources/character/character.service';
import { Types } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { Character } from '@/resources/character/core/schemas/character.schema';
import { GoneException, NotFoundException } from '@nestjs/common';

describe('CharacterController - findAll', () => {
  let controller: CharacterController;
  let characterService: any;

  beforeEach(async () => {
    characterService = {
      findAllByUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CharacterController],
      providers: [
        { provide: CharacterService, useValue: characterService },
        {
          provide: getModelToken(Character.name),
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<CharacterController>(CharacterController);
  });

  it('should return all characters for user with query options', async () => {
    const mockReq = { user: { userId: 'userId123' } };
    const mockResult = { data: ['character1'], message: 'ok' };

    characterService.findAllByUser.mockResolvedValue(mockResult);

    const result = await controller.findAll(
      mockReq,
      1,
      20,
      'John Doe',
      '-updatedAt'
    );

    expect(characterService.findAllByUser).toHaveBeenCalledWith('userId123', {
      page: 1,
      offset: 20,
      name: 'John Doe',
      sort: '-updatedAt',
    });
    expect(result).toBe(mockResult);
  });
});

describe('CharacterController - findOne', () => {
  let controller: CharacterController;
  let characterService: any;
  let characterModel: any;

  const characterId = new Types.ObjectId();

  beforeEach(async () => {
    characterService = {
      findOne: jest.fn(),
    };

    characterModel = {
      findById: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue({ deletedAt: null }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CharacterController],
      providers: [
        { provide: CharacterService, useValue: characterService },
        { provide: getModelToken(Character.name), useValue: characterModel },
      ],
    }).compile();

    controller = module.get<CharacterController>(CharacterController);
  });

  it('should return character if found and not deleted', async () => {
    const mockData = { _id: characterId };
    characterService.findOne.mockResolvedValue(mockData);

    const result = await controller.findOne(characterId);

    expect(characterModel.findById).toHaveBeenCalled();
    expect(characterService.findOne).toHaveBeenCalledWith(characterId);
    expect(result).toBe(mockData);
  });
});

describe('CharacterController - remove', () => {
  let controller: CharacterController;
  let characterService: any;
  let characterModel: any;

  const characterId = new Types.ObjectId();

  beforeEach(async () => {
    characterService = {
      remove: jest.fn(),
    };

    characterModel = {
      findById: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue({ deletedAt: null }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CharacterController],
      providers: [
        { provide: CharacterService, useValue: characterService },
        { provide: getModelToken(Character.name), useValue: characterModel },
      ],
    }).compile();

    controller = module.get<CharacterController>(CharacterController);
  });

  it('should remove character after validation', async () => {
    characterService.remove.mockResolvedValue({ data: 'deleted' });

    const result = await controller.remove(characterId);

    expect(characterModel.findById).toHaveBeenCalled();
    expect(characterService.remove).toHaveBeenCalledWith(characterId);
    expect(result).toEqual({ data: 'deleted' });
  });
});

describe('CharacterController - validateResource', () => {
  let controller: CharacterController;
  let characterModel: any;

  const validId = new Types.ObjectId();

  beforeEach(async () => {
    characterModel = {
      findById: jest.fn().mockReturnThis(),
      exec: jest.fn(),
    };

    const module = await Test.createTestingModule({
      controllers: [CharacterController],
      providers: [
        { provide: CharacterService, useValue: {} },
        { provide: getModelToken(Character.name), useValue: characterModel },
      ],
    }).compile();

    controller = module.get(CharacterController);
  });

  it('should throw NotFoundException if character is not found', async () => {
    characterModel.exec.mockResolvedValue(null);

    await expect(
      (controller as any).validateResource(validId),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw GoneException if character is soft-deleted', async () => {
    characterModel.exec.mockResolvedValue({ deletedAt: new Date() });

    await expect(
      (controller as any).validateResource(validId),
    ).rejects.toThrow(GoneException);
  });

  it('should pass silently if character exists and is not deleted', async () => {
    characterModel.exec.mockResolvedValue({ deletedAt: null });

    await expect(
      (controller as any).validateResource(validId),
    ).resolves.toBeUndefined();
  });
});