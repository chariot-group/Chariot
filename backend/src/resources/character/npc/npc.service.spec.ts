import { Test, TestingModule } from '@nestjs/testing';
import { NpcService } from './npc.service';
import { getModelToken } from '@nestjs/mongoose';
import { Character } from '@/resources/character/core/schemas/character.schema';
import { Group } from '@/resources/group/schemas/group.schema';
import { BadRequestException, GoneException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';

describe('NpcService - validateGroupRelations', () => {
  let service: NpcService;
  let characterModel: any;
  let groupModel: any;

  beforeEach(async () => {
    characterModel = {
      discriminators: {
        npc: jest.fn(),
      },
    };
    groupModel = {
      findById: jest.fn().mockReturnThis(),
      exec: jest.fn(),
      updateMany: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NpcService,
        { provide: getModelToken(Character.name), useValue: characterModel },
        { provide: getModelToken(Group.name), useValue: groupModel },
      ],
    }).compile();

    service = module.get<NpcService>(NpcService);
  });

  it('should throw BadRequestException for invalid group IDs', async () => {
    await expect(service['validateGroupRelations'](['invalid-id'])).rejects.toThrow(BadRequestException);
  });

  it('should throw NotFoundException when group not found', async () => {
    groupModel.findById.mockReturnValueOnce({ exec: () => Promise.resolve(null) });
    await expect(service['validateGroupRelations'](['64a1b2c3d4e5f6789012345a'])).rejects.toThrow(NotFoundException);
  });

  it('should throw GoneException when group is deleted', async () => {
    groupModel.findById.mockReturnValueOnce({ exec: () => Promise.resolve({ deletedAt: new Date() }) });
    await expect(service['validateGroupRelations'](['64a1b2c3d4e5f6789012345a'])).rejects.toThrow(GoneException);
  });

  it('should resolve successfully for valid groups', async () => {
    groupModel.findById.mockReturnValueOnce({ exec: () => Promise.resolve({ deletedAt: null }) });
    await expect(service['validateGroupRelations'](['64a1b2c3d4e5f6789012345a'])).resolves.toBeUndefined();
  });

  it('should resolve immediately if groupIds is null or empty', async () => {
    await expect(service['validateGroupRelations'](null)).resolves.toBeUndefined();
    await expect(service['validateGroupRelations'](undefined)).resolves.toBeUndefined();
    await expect(service['validateGroupRelations']([])).resolves.toBeUndefined();
  });
});

describe('NpcService - create', () => {
  let service: NpcService;
  let characterModel: any;
  let groupModel: any;

  const userId = new Types.ObjectId();

  const groupId1 = new Types.ObjectId('64a1b2c3d4e5f6789012345a');
  const groupId2 = new Types.ObjectId('64a1b2c3d4e5f6789012345b');

  const mockCreateNpcDto = {
    name: 'Test NPC',
    description: 'Test description',
    groups: [groupId1.toHexString(), groupId2.toHexString()],
    profile: {
      name: 'Test NPC',
      race: 'Humanoïde',
      alignment: 'Neutre',
      background: 'Villageois',
      type: 'PNJ',
      subtype: 'Humain',
    },
    challenge: {
      challengeRating: 1,
      experiencePoints: 200,
    },
    actions: {
      standard: [
        {
          name: 'Coup de bâton',
          type: 'attaque',
          attackBonus: 2,
          damage: {
            dice: '1d6',
            type: 'contondant',
          },
          range: '1.5m',
        },
      ],
      legendary: [],
      lair: [],
    },
    inventory: [],
    languages: ['Commun'],
    stats: {
      strength: 10,
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10,
      size: 'M', // or appropriate value for your app
      senses: [],
    },
    affinities: {
      resistances: [],
      immunities: [],
      vulnerabilities: [],
    },
    abilities: [],
    spellcasting: null,
  };

  const mockGroup = {
    _id: new Types.ObjectId(),
    name: 'Test Group',
    deletedAt: null,
  };

  const mockCreatedNpc = {
    _id: new Types.ObjectId(),
    ...mockCreateNpcDto,
    createdBy: userId,
    save: jest.fn(),
  };

  beforeEach(async () => {
    characterModel = {
      discriminators: {
        npc: jest.fn().mockImplementation((data) => ({
          ...data,
          save: jest.fn().mockResolvedValue(mockCreatedNpc),
        })),
      },
    };

    groupModel = {
      findById: jest.fn().mockReturnThis(),
      exec: jest.fn(),
      updateMany: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NpcService,
        { provide: getModelToken(Character.name), useValue: characterModel },
        { provide: getModelToken(Group.name), useValue: groupModel },
      ],
    }).compile();

    service = module.get<NpcService>(NpcService);
  });

  it('should create an NPC and update related groups', async () => {
    groupModel.exec.mockResolvedValue(mockGroup);
    groupModel.updateMany.mockResolvedValue({});

    const result = await service.create(mockCreateNpcDto, userId);

    expect(characterModel.discriminators.npc).toHaveBeenCalledWith({
      ...mockCreateNpcDto,
      createdBy: userId,
    });

    expect(groupModel.findById).toHaveBeenCalledTimes(2);
    expect(groupModel.updateMany).toHaveBeenCalledWith(
      { _id: { $in: mockCreateNpcDto.groups } },
      { $addToSet: { characters: mockCreatedNpc._id } },
    );

    expect(result).toEqual({
      message: expect.stringMatching(/NPC created in \d+ms/),
      data: mockCreatedNpc,
    });
  });

  it('should create an NPC without groups', async () => {
    const npcDtoWithoutGroups = {
      name: 'Test NPC',
      description: 'Test description',
      profile: {
        name: 'Test NPC',
        race: 'Humanoïde',
        alignment: 'Neutre',
        background: 'Villageois',
        type: 'PNJ',
        subtype: 'Humain',
      },
      challenge: {
        challengeRating: 1,
        experiencePoints: 200,
      },
      actions: {
        standard: [
          {
            name: 'Coup de bâton',
            type: 'attaque',
            attackBonus: 2,
            damage: {
              dice: '1d6',
              type: 'contondant',
            },
            range: '1.5m',
          },
        ],
        legendary: [],
        lair: [],
      },
      inventory: [],
      languages: ['Commun'],
      stats: {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
        size: 'M', // or appropriate value for your app
        senses: [],
      },
      affinities: {
        resistances: [],
        immunities: [],
        vulnerabilities: [],
      },
      abilities: [],
      spellcasting: null,
    };

    const result = await service.create(npcDtoWithoutGroups, userId);

    expect(characterModel.discriminators.npc).toHaveBeenCalledWith({
      ...npcDtoWithoutGroups,
      createdBy: userId,
    });

    expect(groupModel.findById).not.toHaveBeenCalled();
    expect(result).toEqual({
      message: expect.stringMatching(/NPC created in \d+ms/),
      data: mockCreatedNpc,
    });
  });

  it('should throw BadRequestException for invalid group ID format', async () => {
    const invalidDto = {
      ...mockCreateNpcDto,
      groups: ['invalid-id'],
    };

    await expect(service.create(invalidDto, userId)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should throw NotFoundException when group does not exist', async () => {
    groupModel.exec.mockResolvedValue(null);

    await expect(service.create(mockCreateNpcDto, userId)).rejects.toThrow(
      NotFoundException,
    );

    expect(groupModel.findById).toHaveBeenCalledWith(mockCreateNpcDto.groups[0]);
  });

  it('should throw GoneException when group is deleted', async () => {
    const deletedGroup = {
      ...mockGroup,
      deletedAt: new Date(),
    };
    groupModel.exec.mockResolvedValue(deletedGroup);

    await expect(service.create(mockCreateNpcDto, userId)).rejects.toThrow(
      GoneException,
    );
  });

  it('should handle errors and log them', async () => {
    groupModel.exec.mockResolvedValue(mockGroup);
    characterModel.discriminators.npc.mockImplementation(() => {
      throw new Error('DB failure');
    });

    const loggerSpy = jest.spyOn(service['logger'], 'error').mockImplementation(() => { });

    await expect(service.create(mockCreateNpcDto, userId)).rejects.toThrow(
      InternalServerErrorException,
    );

    expect(loggerSpy).toHaveBeenCalledWith(
      expect.stringMatching(/Error creating NPC: DB failure/),
    );

    loggerSpy.mockRestore();
  });
  it('should not call updateMany when creating NPC without groups', async () => {
    const npcDtoWithoutGroups = {
      ...mockCreateNpcDto,
      groups: undefined,
    };

    const saveMock = jest.fn().mockResolvedValue(mockCreatedNpc);
    characterModel.discriminators.npc.mockImplementation(() => ({
      ...npcDtoWithoutGroups,
      save: saveMock,
    }));

    const result = await service.create(npcDtoWithoutGroups, userId);

    expect(groupModel.updateMany).not.toHaveBeenCalled();
    expect(result).toEqual({
      message: expect.stringMatching(/NPC created in \d+ms/),
      data: mockCreatedNpc,
    });
  });
});

describe('NpcService - update', () => {
  let service: NpcService;
  let characterModel: any;
  let groupModel: any;

  const npcId = new Types.ObjectId();
  const existingNpc = {
    _id: npcId,
    name: 'Original NPC',
    groups: [
      { _id: new Types.ObjectId('64a1b2c3d4e5f6789012345a') },
      { _id: new Types.ObjectId('64a1b2c3d4e5f6789012345b') },
    ],
  };

  const mockGroup = {
    _id: new Types.ObjectId(),
    name: 'Test Group',
    deletedAt: null,
  };

  const mockUpdateNpcDto = {
    name: 'Updated NPC',
    groups: ['64a1b2c3d4e5f6789012345c'],
  };

  beforeEach(async () => {
    characterModel = {
      findById: jest.fn().mockReturnThis(),
      exec: jest.fn(),
      discriminators: {
        npc: {
          updateOne: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
          }),
        },
      },
      populate: jest.fn().mockReturnThis(),
    };

    groupModel = {
      findById: jest.fn().mockReturnThis(),
      exec: jest.fn(),
      updateMany: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NpcService,
        { provide: getModelToken(Character.name), useValue: characterModel },
        { provide: getModelToken(Group.name), useValue: groupModel },
      ],
    }).compile();

    service = module.get<NpcService>(NpcService);
  });

  it('should update NPC and manage group relations', async () => {
    characterModel.exec
      .mockResolvedValueOnce(existingNpc) // findById initial
      .mockResolvedValueOnce({ modifiedCount: 1 }) // updateOne
      .mockResolvedValueOnce({ ...existingNpc, ...mockUpdateNpcDto }); // findById après update

    groupModel.exec.mockResolvedValue(mockGroup);
    groupModel.updateMany.mockResolvedValue({});

    const result = await service.update(npcId, mockUpdateNpcDto);

    expect(characterModel.findById).toHaveBeenCalledWith(npcId);
    expect(groupModel.findById).toHaveBeenCalledWith('64a1b2c3d4e5f6789012345c');
    expect(characterModel.discriminators.npc.updateOne).toHaveBeenCalledWith(
      { _id: npcId },
      {
        name: 'Updated NPC',
        groups: ['64a1b2c3d4e5f6789012345c'],
      },
    );

    expect(groupModel.updateMany).toHaveBeenCalledTimes(2); // add + remove
    expect(result).toEqual({
      message: expect.stringMatching(/NPC #.* update in \d+ms/),
      data: expect.any(Object),
    });
  });

  it('should update NPC without changing groups when groups not provided', async () => {
    const updateDtoWithoutGroups = { name: 'Updated NPC' };

    characterModel.exec
      .mockResolvedValueOnce(existingNpc)
      .mockResolvedValueOnce({ modifiedCount: 1 })
      .mockResolvedValueOnce({ ...existingNpc, ...updateDtoWithoutGroups });

    groupModel.updateMany.mockResolvedValue({});

    const result = await service.update(npcId, updateDtoWithoutGroups);

    expect(characterModel.discriminators.npc.updateOne).toHaveBeenCalledWith(
      { _id: npcId },
      {
        name: 'Updated NPC',
        groups: ['64a1b2c3d4e5f6789012345a', '64a1b2c3d4e5f6789012345b'],
      },
    );

    expect(result).toHaveProperty('message');
    expect(result).toHaveProperty('data');
  });

  it('should throw BadRequestException for invalid group IDs', async () => {
    characterModel.exec.mockResolvedValueOnce(existingNpc);
    groupModel.exec.mockResolvedValue(null);

    const loggerSpy = jest.spyOn(service['logger'], 'error').mockImplementation(() => { });

    await expect(service.update(npcId, mockUpdateNpcDto)).rejects.toThrow(
      BadRequestException,
    );

    expect(loggerSpy).toHaveBeenCalledWith(
      expect.stringMatching(/Invalid group IDs:/),
      null,
      'NpcService',
    );

    loggerSpy.mockRestore();
  });

  it('should throw GoneException for deleted groups', async () => {
    characterModel.exec.mockResolvedValueOnce(existingNpc);

    const deletedGroup = {
      ...mockGroup,
      deletedAt: new Date(),
    };
    groupModel.exec.mockResolvedValue(deletedGroup);

    const loggerSpy = jest.spyOn(service['logger'], 'error').mockImplementation(() => { });

    await expect(service.update(npcId, mockUpdateNpcDto)).rejects.toThrow(
      GoneException,
    );

    expect(loggerSpy).toHaveBeenCalledWith(
      expect.stringMatching(/Gone group IDs:/),
      null,
      'NpcService',
    );

    loggerSpy.mockRestore();
  });

  it('should throw NotFoundException when NPC is not found', async () => {
    characterModel.exec
      .mockResolvedValueOnce(existingNpc);
    // Mock updateOne().exec() to return { modifiedCount: 0 }
    characterModel.discriminators.npc.updateOne.mockReturnValueOnce({
      exec: jest.fn().mockResolvedValue({ modifiedCount: 0 }),
    });

    groupModel.exec.mockResolvedValue(mockGroup);

    const loggerSpy = jest.spyOn(service['logger'], 'error').mockImplementation(() => { });

    await expect(service.update(npcId, mockUpdateNpcDto)).rejects.toThrow(
      NotFoundException,
    );

    expect(loggerSpy).toHaveBeenCalledWith(
      expect.stringMatching(/NPC #.* not found/),
      null,
      'NpcService',
    );

    loggerSpy.mockRestore();
  });

  it('should throw InternalServerErrorException on unexpected error', async () => {
    characterModel.exec.mockRejectedValue(new Error('DB fail'));

    const loggerSpy = jest.spyOn(service['logger'], 'error').mockImplementation(() => { });

    await expect(service.update(npcId, mockUpdateNpcDto)).rejects.toThrow(
      InternalServerErrorException,
    );

    expect(loggerSpy).toHaveBeenCalledWith(
      expect.stringMatching(/Error while updating #.* NPC: DB fail/),
      null,
      'NpcService',
    );

    loggerSpy.mockRestore();
  });

  it('should not throw and skip group validation if groups is empty or undefined', async () => {
    // Cas avec groups = []
    const updateDtoEmptyGroups = { name: 'NPC without groups', groups: [] };
    characterModel.discriminators.npc.updateOne.mockReturnValueOnce({
      exec: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
    });
    characterModel.exec.mockResolvedValueOnce(existingNpc);
    characterModel.exec.mockResolvedValueOnce({ ...existingNpc, ...updateDtoEmptyGroups });

    await expect(service.update(npcId, updateDtoEmptyGroups)).resolves.not.toThrow();

    // Cas avec groups = undefined
    const updateDtoNoGroups = { name: 'NPC no groups field' };
    characterModel.discriminators.npc.updateOne.mockReturnValueOnce({
      exec: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
    });
    characterModel.exec.mockResolvedValueOnce(existingNpc);
    characterModel.exec.mockResolvedValueOnce({ ...existingNpc, ...updateDtoNoGroups });

    await expect(service.update(npcId, updateDtoNoGroups)).resolves.not.toThrow();
  });

  it('should throw BadRequestException for invalid group ID format in update', async () => {
    const invalidGroupsDto = { name: 'NPC with invalid group', groups: ['invalid-id'] };

    characterModel.exec.mockResolvedValueOnce(existingNpc);
    groupModel.exec.mockResolvedValue(null);

    const loggerSpy = jest.spyOn(service['logger'], 'error').mockImplementation(() => { });

    await expect(service.update(npcId, invalidGroupsDto)).rejects.toThrow(BadRequestException);

    expect(loggerSpy).toHaveBeenCalledWith(
      expect.stringMatching(/Invalid group IDs?: invalid-id/),
      null,
      'NpcService',
    );

    loggerSpy.mockRestore();
  });

  it('should log verbose message on successful update', async () => {
    characterModel.exec
      .mockResolvedValueOnce(existingNpc) // findById avant update
      .mockResolvedValueOnce({ modifiedCount: 1 }) // updateOne
      .mockResolvedValueOnce({ ...existingNpc, ...mockUpdateNpcDto }); // findById après update

    groupModel.exec.mockResolvedValue(mockGroup);
    groupModel.updateMany.mockResolvedValue({});

    const verboseSpy = jest.spyOn(service['logger'], 'verbose').mockImplementation(() => { });

    const result = await service.update(npcId, mockUpdateNpcDto);

    expect(verboseSpy).toHaveBeenCalledWith(
      expect.stringMatching(/NPC #.* update in \d+ms/),
      service['SERVICE_NAME'],
    );

    verboseSpy.mockRestore();
  });
});