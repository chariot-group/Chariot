import { Test, TestingModule } from '@nestjs/testing';
import { CharacterService } from './character.service';
import { getModelToken } from '@nestjs/mongoose';
import { Character } from '@/resources/character/core/schemas/character.schema';
import { Group } from '@/resources/group/schemas/group.schema';
import {
  InternalServerErrorException,
  NotFoundException,
  GoneException
} from '@nestjs/common';
import { Types } from 'mongoose';

describe('CharacterService - findAllByUser', () => {
  let service: CharacterService;
  let characterModel: any;
  let groupModel: any;

  const userId = new Types.ObjectId();

  const mockCharacter = {
    _id: new Types.ObjectId(),
    name: 'Test Character',
    createdBy: userId,
    groups: ['group1'],
    deletedAt: null,
  };

  beforeEach(async () => {
    characterModel = {
      find: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      countDocuments: jest.fn(),
    };
    groupModel = {};

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CharacterService,
        { provide: getModelToken(Character.name), useValue: characterModel },
        { provide: getModelToken(Group.name), useValue: groupModel },
      ],
    }).compile();

    service = module.get<CharacterService>(CharacterService);
  });

  it('should return characters with pagination and name filtering', async () => {
    characterModel.skip.mockResolvedValue([mockCharacter]);
    characterModel.countDocuments.mockResolvedValue(1);

    const loggerSpy = jest.spyOn(service['logger'], 'verbose').mockImplementation(() => { });

    const result = await service.findAllByUser(userId, {
      page: 1,
      offset: 10,
      name: 'Test',
      sort: '-updatedAt',
    });

    expect(characterModel.find).toHaveBeenCalledWith({
      name: { $regex: 'Test', $options: 'i' },
      deletedAt: { $eq: null },
      createdBy: userId,
    });

    expect(characterModel.sort).toHaveBeenCalledWith({ updatedAt: 'desc' });
    expect(characterModel.limit).toHaveBeenCalledWith(10);
    expect(characterModel.skip).toHaveBeenCalledWith(0);

    expect(characterModel.countDocuments).toHaveBeenCalledWith({
      name: { $regex: 'Test', $options: 'i' },
      deletedAt: { $eq: null },
      createdBy: userId,
    });

    expect(loggerSpy).toHaveBeenCalledWith(
      expect.stringMatching(/Characters found in \d+ms/),
      'CharacterService',
    );

    expect(result).toEqual({
      message: expect.stringMatching(/Characters found in \d+ms/),
      data: [mockCharacter],
      pagination: {
        page: 1,
        offset: 10,
        total: 1,
      },
    });

    loggerSpy.mockRestore();
  });

  it('should filter by groupId when provided', async () => {
    characterModel.skip.mockResolvedValue([mockCharacter]);
    characterModel.countDocuments.mockResolvedValue(1);

    const groupId = 'group1';
    const result = await service.findAllByUser(userId, { page: 1, offset: 10 }, groupId);

    expect(characterModel.find).toHaveBeenCalledWith({
      name: { $regex: '', $options: 'i' },
      deletedAt: { $eq: null },
      createdBy: userId,
      groups: { $in: [groupId] },
    });

    expect(result.data).toEqual([mockCharacter]);
  });

  it('should apply default pagination and sorting when not provided', async () => {
    characterModel.skip.mockResolvedValue([]);
    characterModel.countDocuments.mockResolvedValue(0);

    const result = await service.findAllByUser(userId, {});

    expect(characterModel.sort).toHaveBeenCalledWith({ updatedAt: 'asc' });
    expect(characterModel.limit).toHaveBeenCalledWith(10);
    expect(characterModel.skip).toHaveBeenCalledWith(0);
    expect(result.pagination).toEqual({ page: 1, offset: 10, total: 0 });
  });

  it('should handle ascending sort without dash prefix', async () => {
    characterModel.skip.mockResolvedValue([]);
    characterModel.countDocuments.mockResolvedValue(0);

    await service.findAllByUser(userId, { sort: 'name' });

    expect(characterModel.sort).toHaveBeenCalledWith({ name: 'asc', updatedAt: 'asc' });
  });

  it('should throw InternalServerErrorException if query fails', async () => {
    characterModel.skip.mockRejectedValue(new Error('DB Fail'));

    const loggerSpy = jest.spyOn(service['logger'], 'error').mockImplementation(() => { });

    await expect(service.findAllByUser(userId, {})).rejects.toThrow(
      InternalServerErrorException,
    );

    expect(loggerSpy).toHaveBeenCalledWith(
      expect.stringMatching(/Error while fetching characters: DB Fail/),
      null,
      'CharacterService',
    );

    loggerSpy.mockRestore();
  });
});

describe('CharacterService - findOne', () => {
  let service: CharacterService;
  let characterModel: any;

  const characterId = new Types.ObjectId();
  const mockCharacter = {
    _id: characterId,
    name: 'Test Character',
    groups: [],
  };

  beforeEach(async () => {
    characterModel = {
      findById: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CharacterService,
        { provide: getModelToken(Character.name), useValue: characterModel },
        { provide: getModelToken(Group.name), useValue: {} },
      ],
    }).compile();

    service = module.get<CharacterService>(CharacterService);
  });

  it('should return a character with populated groups and log success message', async () => {
    characterModel.exec.mockResolvedValue(mockCharacter);

    const loggerSpy = jest.spyOn(service['logger'], 'verbose').mockImplementation(() => { });

    const result = await service.findOne(characterId);

    expect(characterModel.findById).toHaveBeenCalledWith(characterId);
    expect(characterModel.populate).toHaveBeenCalledWith('groups');
    expect(characterModel.exec).toHaveBeenCalled();

    expect(loggerSpy).toHaveBeenCalledWith(
      expect.stringMatching(/Character #.* found in \d+ms/),
      'CharacterService',
    );

    expect(result).toEqual({
      message: expect.stringMatching(/Character #.* found in \d+ms/),
      data: mockCharacter,
    });

    loggerSpy.mockRestore();
  });

  it('should throw InternalServerErrorException and log error if query fails', async () => {
    characterModel.exec.mockRejectedValue(new Error('DB Error'));

    const loggerSpy = jest.spyOn(service['logger'], 'error').mockImplementation(() => { });

    await expect(service.findOne(characterId)).rejects.toThrow(
      InternalServerErrorException,
    );

    expect(loggerSpy).toHaveBeenCalledWith(
      expect.stringMatching(/Error while fetching character #.*: DB Error/),
      null,
      'CharacterService',
    );

    loggerSpy.mockRestore();
  });
});

describe('CharacterService - remove', () => {
  let service: CharacterService;
  let characterModel: any;
  let groupModel: any;

  const characterId = new Types.ObjectId();
  let mockCharacter: any;

  beforeEach(async () => {
    mockCharacter = {
      _id: characterId,
      name: 'Test Character',
      groups: ['group1', 'group2'],
      deletedAt: null,
      save: jest.fn(),
    };

    characterModel = {
      findById: jest.fn().mockReturnThis(),
      exec: jest.fn(),
    };
    groupModel = {
      updateOne: jest.fn().mockReturnThis(),
      exec: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CharacterService,
        { provide: getModelToken(Character.name), useValue: characterModel },
        { provide: getModelToken(Group.name), useValue: groupModel },
      ],
    }).compile();

    service = module.get<CharacterService>(CharacterService);
  });

  it('should soft delete character and remove from groups', async () => {
    characterModel.exec.mockResolvedValue(mockCharacter);
    groupModel.exec.mockResolvedValue({});
    mockCharacter.save.mockResolvedValue(mockCharacter);

    const loggerSpy = jest.spyOn(service['logger'], 'verbose').mockImplementation(() => { });

    const result = await service.remove(characterId);

    expect(characterModel.findById).toHaveBeenCalledWith(characterId);
    expect(characterModel.exec).toHaveBeenCalled();

    expect(groupModel.updateOne).toHaveBeenCalledTimes(2);
    expect(groupModel.updateOne).toHaveBeenCalledWith(
      { _id: 'group1' },
      { $pull: { characters: characterId } },
    );
    expect(groupModel.updateOne).toHaveBeenCalledWith(
      { _id: 'group2' },
      { $pull: { characters: characterId } },
    );

    expect(mockCharacter.deletedAt).toBeInstanceOf(Date);
    expect(mockCharacter.save).toHaveBeenCalled();

    expect(loggerSpy).toHaveBeenCalledWith(
      expect.stringMatching(/Character #.* delete in \d+ms/),
      'CharacterService',
    );

    expect(result).toEqual({
      message: expect.stringMatching(/Character #.* delete in \d+ms/),
      data: mockCharacter,
    });

    loggerSpy.mockRestore();
  });

  it('should throw NotFoundException if character not found', async () => {
    characterModel.exec.mockResolvedValue(null);

    const loggerSpy = jest.spyOn(service['logger'], 'error').mockImplementation(() => { });

    await expect(service.remove(characterId)).rejects.toThrow(
      NotFoundException,
    );

    expect(loggerSpy).toHaveBeenCalledWith(
      expect.stringMatching(/Character #.* not found/),
      null,
      'CharacterService',
    );

    expect(groupModel.updateOne).not.toHaveBeenCalled();
    expect(mockCharacter.save).not.toHaveBeenCalled();

    loggerSpy.mockRestore();
  });

  it('should throw GoneException if character already deleted', async () => {
    const deletedCharacter = { ...mockCharacter, deletedAt: new Date() };
    characterModel.exec.mockResolvedValue(deletedCharacter);

    const loggerSpy = jest.spyOn(service['logger'], 'error').mockImplementation(() => { });

    await expect(service.remove(characterId)).rejects.toThrow(
      GoneException,
    );

    expect(loggerSpy).toHaveBeenCalledWith(
      expect.stringMatching(/Character #.* already deleted/),
      null,
      'CharacterService',
    );

    expect(groupModel.updateOne).not.toHaveBeenCalled();
    expect(mockCharacter.save).not.toHaveBeenCalled();

    loggerSpy.mockRestore();
  });

  it('should throw InternalServerErrorException on unexpected error', async () => {
    characterModel.exec.mockRejectedValue(new Error('DB fail'));

    const loggerSpy = jest.spyOn(service['logger'], 'error').mockImplementation(() => { });

    await expect(service.remove(characterId)).rejects.toThrow(
      InternalServerErrorException,
    );

    expect(loggerSpy).toHaveBeenCalledWith(
      expect.stringMatching(/Error while deleting character #.*: DB fail/),
      null,
      'CharacterService',
    );

    loggerSpy.mockRestore();
  });

  it('should not throw NotFoundException or GoneException errors', async () => {
    const notFoundError = new NotFoundException('Character not found');
    characterModel.exec.mockRejectedValue(notFoundError);

    await expect(service.remove(characterId)).rejects.toThrow(
      NotFoundException,
    );

    const goneError = new GoneException('Character already deleted');
    characterModel.exec.mockRejectedValue(goneError);

    await expect(service.remove(characterId)).rejects.toThrow(
      GoneException,
    );
  });
});