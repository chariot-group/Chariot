import { Test, TestingModule } from '@nestjs/testing';
import { GroupController } from '@/resources/group/group.controller';
import { GroupService } from '@/resources/group/group.service';
import { CharacterService } from '@/resources/character/character.service';
import { Types } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { Group } from '@/resources/group/schemas/group.schema';
import { Campaign } from '@/resources/campaign/schemas/campaign.schema';
import { Character } from '@/resources/character/core/schemas/character.schema';
import { BadRequestException, NotFoundException, GoneException } from '@nestjs/common';
import type { CreateGroupDto } from '@/resources/group/dto/create-group.dto';
import type { UpdateGroupDto } from '@/resources/group/dto/update-group.dto';

describe('GroupController - create', () => {
  let controller: GroupController;
  let groupService: any;
  let characterService: any;
  let groupModel: any;
  let campaignModel: any;
  let characterModel: any;

  const userId = new Types.ObjectId();
  const requestMock = { user: { userId } };

  const characterId = new Types.ObjectId().toHexString();
  const campaignId = new Types.ObjectId().toHexString();

  const createDto: CreateGroupDto = {
    label: 'Test Group',
    description: 'Desc',
    characters: [characterId],
    campaigns: [{ idCampaign: campaignId, type: 'main' }],
  };

  beforeEach(async () => {
    groupService = {
      create: jest.fn(),
    };
    characterService = {
      findAllByUser: jest.fn(),
    };
    groupModel = {
      findById: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue({ deletedAt: null }),
    };
    campaignModel = {
      findById: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue({ deletedAt: null }),
    };
    characterModel = {
      findById: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue({ deletedAt: null }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GroupController],
      providers: [
        { provide: GroupService, useValue: groupService },
        { provide: CharacterService, useValue: characterService },
        { provide: getModelToken(Group.name), useValue: groupModel },
        { provide: getModelToken(Campaign.name), useValue: campaignModel },
        { provide: getModelToken(Character.name), useValue: characterModel },
      ],
    }).compile();

    controller = module.get<GroupController>(GroupController);
  });

  it('should create a group after validating characters and campaigns', async () => {
    groupService.create.mockResolvedValue({ data: 'createdGroup' });

    const result = await controller.create(requestMock, createDto);

    expect(characterModel.findById).toHaveBeenCalledTimes(1);
    expect(campaignModel.findById).toHaveBeenCalledTimes(1);
    expect(groupService.create).toHaveBeenCalledWith(createDto, userId);
    expect(result).toEqual({ data: 'createdGroup' });
  });

  it('should throw BadRequestException if a character ID is invalid', async () => {
    const invalidDto: CreateGroupDto = { ...createDto, characters: ['invalid-id'] };
    await expect(controller.create(requestMock, invalidDto)).rejects.toThrow(BadRequestException);
  });

  it('should throw NotFoundException if a character is not found', async () => {
    characterModel.exec.mockResolvedValue(null);
    await expect(controller.create(requestMock, createDto)).rejects.toThrow(NotFoundException);
  });

  it('should throw GoneException if a character is deleted', async () => {
    characterModel.exec.mockResolvedValue({ deletedAt: new Date() });
    await expect(controller.create(requestMock, createDto)).rejects.toThrow(GoneException);
  });

  it('should throw BadRequestException if a campaign ID is invalid', async () => {
    const invalidDto: CreateGroupDto = {
      ...createDto,
      campaigns: [{ idCampaign: 'invalid-id', type: 'main' }]
    };
    await expect(controller.create(requestMock, invalidDto)).rejects.toThrow(BadRequestException);
  });

  it('should throw NotFoundException if a campaign is not found', async () => {
    campaignModel.exec.mockResolvedValue(null);
    await expect(controller.create(requestMock, createDto)).rejects.toThrow(NotFoundException);
  });

  it('should throw GoneException if a campaign is deleted', async () => {
    campaignModel.exec.mockResolvedValue({ deletedAt: new Date() });
    await expect(controller.create(requestMock, createDto)).rejects.toThrow(GoneException);
  });
});

describe('GroupController - findAll', () => {
  let controller: GroupController;
  let groupService: any;

  beforeEach(async () => {
    groupService = {
      findAllByUser: jest.fn(),
    };

    const module = await Test.createTestingModule({
      controllers: [GroupController],
      providers: [
        { provide: GroupService, useValue: groupService },
        { provide: CharacterService, useValue: {} },
        { provide: getModelToken(Group.name), useValue: {} },
        { provide: getModelToken(Campaign.name), useValue: {} },
        { provide: getModelToken(Character.name), useValue: {} },
      ],
    }).compile();

    controller = module.get<GroupController>(GroupController);
  });

  it('should return all groups for user with query options', async () => {
    const mockReq = { user: { userId: 'userId123' } };
    const mockResult = { data: ['group1'], message: 'ok' };

    groupService.findAllByUser.mockResolvedValue(mockResult);

    const result = await controller.findAll(
      mockReq,
      1,
      10,
      'Label',
      '-createdAt',
      true,
    );

    expect(groupService.findAllByUser).toHaveBeenCalledWith('userId123', {
      page: 1,
      offset: 10,
      label: 'Label',
      sort: '-createdAt',
      onlyWithMembers: true,
    });
    expect(result).toBe(mockResult);
  });
});

describe('GroupController - findOne', () => {
  let controller: GroupController;
  let groupService: any;
  let groupModel: any;

  const groupId = new Types.ObjectId();

  beforeEach(async () => {
    groupService = {
      findOne: jest.fn(),
    };
    groupModel = {
      findById: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue({ deletedAt: null }),
    };

    const module = await Test.createTestingModule({
      controllers: [GroupController],
      providers: [
        { provide: GroupService, useValue: groupService },
        { provide: CharacterService, useValue: {} },
        { provide: getModelToken(Group.name), useValue: groupModel },
        { provide: getModelToken(Campaign.name), useValue: {} },
        { provide: getModelToken(Character.name), useValue: {} },
      ],
    }).compile();

    controller = module.get<GroupController>(GroupController);
  });

  it('should return group if found and not deleted', async () => {
    const mockData = { _id: groupId };
    groupService.findOne.mockResolvedValue(mockData);

    const result = await controller.findOne(groupId);

    expect(groupModel.findById).toHaveBeenCalled();
    expect(groupService.findOne).toHaveBeenCalledWith(groupId);
    expect(result).toBe(mockData);
  });
});

describe('GroupController - update', () => {
  let controller: GroupController;
  let groupService: any;
  let groupModel: any;
  let characterModel: any;
  let campaignModel: any;

  const groupId = new Types.ObjectId();
  const characterId = new Types.ObjectId().toHexString();
  const campaignId = new Types.ObjectId().toHexString();

  const updateDto: UpdateGroupDto = {
    label: 'Updated Group',
    characters: [characterId],
    campaigns: [{ idCampaign: campaignId, type: 'main' }],
  };

  beforeEach(async () => {
    groupService = {
      update: jest.fn(),
    };

    groupModel = {
      findById: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue({ _id: groupId, deletedAt: null }),
    };

    characterModel = {
      findById: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue({ deletedAt: null }),
    };

    campaignModel = {
      findById: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue({ deletedAt: null }),
    };

    const module = await Test.createTestingModule({
      controllers: [GroupController],
      providers: [
        { provide: GroupService, useValue: groupService },
        { provide: CharacterService, useValue: {} },
        { provide: getModelToken(Group.name), useValue: groupModel },
        { provide: getModelToken(Character.name), useValue: characterModel },
        { provide: getModelToken(Campaign.name), useValue: campaignModel },
      ],
    }).compile();

    controller = module.get<GroupController>(GroupController);
  });

  it('should update group after validating resources', async () => {
    groupService.update.mockResolvedValue({ data: 'updated' });

    const result = await controller.update(groupId, updateDto);

    expect(characterModel.findById).toHaveBeenCalled();
    expect(campaignModel.findById).toHaveBeenCalled();
    expect(groupService.update).toHaveBeenCalledWith(groupId, updateDto);
    expect(result).toEqual({ data: 'updated' });
  });
});

describe('GroupController - remove', () => {
  let controller: GroupController;
  let groupService: any;
  let groupModel: any;

  const groupId = new Types.ObjectId();

  beforeEach(async () => {
    groupService = {
      remove: jest.fn(),
    };

    groupModel = {
      findById: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue({ deletedAt: null }),
    };

    const module = await Test.createTestingModule({
      controllers: [GroupController],
      providers: [
        { provide: GroupService, useValue: groupService },
        { provide: CharacterService, useValue: {} },
        { provide: getModelToken(Group.name), useValue: groupModel },
        { provide: getModelToken(Campaign.name), useValue: {} },
        { provide: getModelToken(Character.name), useValue: {} },
      ],
    }).compile();

    controller = module.get<GroupController>(GroupController);
  });

  it('should remove group after validation', async () => {
    groupService.remove.mockResolvedValue({ data: 'deleted' });

    const result = await controller.remove(groupId);

    expect(groupModel.findById).toHaveBeenCalled();
    expect(groupService.remove).toHaveBeenCalledWith(groupId);
    expect(result).toEqual({ data: 'deleted' });
  });
});

describe('GroupController - findAllCharacters', () => {
  let controller: GroupController;
  let characterService: any;

  const userId = new Types.ObjectId().toHexString();
  const groupId = new Types.ObjectId();

  const requestMock = { user: { userId } };

  beforeEach(async () => {
    characterService = {
      findAllByUser: jest.fn(),
    };

    const module = await Test.createTestingModule({
      controllers: [GroupController],
      providers: [
        { provide: GroupService, useValue: {} },
        { provide: CharacterService, useValue: characterService },
        { provide: getModelToken(Group.name), useValue: {} },
        { provide: getModelToken(Campaign.name), useValue: {} },
        { provide: getModelToken(Character.name), useValue: {} },
      ],
    }).compile();

    controller = module.get<GroupController>(GroupController);
  });

  it('should return characters for the group and user', async () => {
    characterService.findAllByUser.mockResolvedValue(['character1']);

    const result = await controller.findAllCharacters(
      requestMock,
      groupId,
      1,
      10,
      'nameTest',
      '-createdAt',
    );

    expect(characterService.findAllByUser).toHaveBeenCalledWith(userId, {
      page: 1,
      offset: 10,
      name: 'nameTest',
      sort: '-createdAt',
    }, groupId.toHexString());

    expect(result).toEqual(['character1']);
  });
});

describe('GroupController - validateResource', () => {
  let controller: GroupController;
  let groupModel: any;

  const validId = new Types.ObjectId();
  const invalidId = 'not-a-valid-id';

  beforeEach(async () => {
    groupModel = {
      findById: jest.fn().mockReturnThis(),
      exec: jest.fn(),
    };

    const module = await Test.createTestingModule({
      controllers: [GroupController],
      providers: [
        { provide: GroupService, useValue: {} },
        { provide: CharacterService, useValue: {} },
        { provide: getModelToken(Group.name), useValue: groupModel },
        { provide: getModelToken(Campaign.name), useValue: {} },
        { provide: getModelToken(Character.name), useValue: {} },
      ],
    }).compile();

    controller = module.get<GroupController>(GroupController);
  });

  it('should throw BadRequestException if id is not a valid ObjectId', async () => {
    await expect(
      (controller as any).validateResource(invalidId),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw NotFoundException if group is not found', async () => {
    groupModel.exec.mockResolvedValue(null);

    await expect(
      (controller as any).validateResource(validId),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw GoneException if group is soft-deleted', async () => {
    groupModel.exec.mockResolvedValue({ deletedAt: new Date() });

    await expect(
      (controller as any).validateResource(validId),
    ).rejects.toThrow(GoneException);
  });

  it('should pass silently if group exists and is not deleted', async () => {
    groupModel.exec.mockResolvedValue({ deletedAt: null });

    await expect(
      (controller as any).validateResource(validId),
    ).resolves.toBeUndefined();
  });
});

describe('GroupController - validateCharacterRelations', () => {
  let controller: GroupController;
  let characterModel: any;

  const validId = new Types.ObjectId().toHexString();
  const invalidId = 'not-a-valid-id';

  beforeEach(async () => {
    characterModel = {
      findById: jest.fn().mockReturnThis(),
      exec: jest.fn(),
    };

    const module = await Test.createTestingModule({
      controllers: [GroupController],
      providers: [
        { provide: GroupService, useValue: {} },
        { provide: CharacterService, useValue: {} },
        { provide: getModelToken(Group.name), useValue: {} },
        { provide: getModelToken(Campaign.name), useValue: {} },
        { provide: getModelToken(Character.name), useValue: characterModel },
      ],
    }).compile();

    controller = module.get<GroupController>(GroupController);
  });

  it('should throw BadRequestException if a character ID is invalid', async () => {
    await expect(
      (controller as any).validateCharacterRelations([invalidId]),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw NotFoundException if a character is not found', async () => {
    characterModel.exec.mockResolvedValue(null);
    await expect(
      (controller as any).validateCharacterRelations([validId]),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw GoneException if a character is deleted', async () => {
    characterModel.exec.mockResolvedValue({ deletedAt: new Date() });
    await expect(
      (controller as any).validateCharacterRelations([validId]),
    ).rejects.toThrow(GoneException);
  });

  it('should pass silently if character exists and is not deleted', async () => {
    characterModel.exec.mockResolvedValue({ deletedAt: null });
    await expect(
      (controller as any).validateCharacterRelations([validId]),
    ).resolves.toBeUndefined();
  });

  it('should pass silently if characterIds is empty or undefined', async () => {
    await expect(
      (controller as any).validateCharacterRelations([]),
    ).resolves.toBeUndefined();

    await expect(
      (controller as any).validateCharacterRelations(undefined),
    ).resolves.toBeUndefined();
  });
});

describe('GroupController - validatecampaignRelations', () => {
  let controller: GroupController;
  let campaignModel: any;

  const validId = new Types.ObjectId().toHexString();
  const invalidId = 'not-a-valid-id';

  beforeEach(async () => {
    campaignModel = {
      findById: jest.fn().mockReturnThis(),
      exec: jest.fn(),
    };

    const module = await Test.createTestingModule({
      controllers: [GroupController],
      providers: [
        { provide: GroupService, useValue: {} },
        { provide: CharacterService, useValue: {} },
        { provide: getModelToken(Group.name), useValue: {} },
        { provide: getModelToken(Campaign.name), useValue: campaignModel },
        { provide: getModelToken(Character.name), useValue: {} },
      ],
    }).compile();

    controller = module.get<GroupController>(GroupController);
  });

  it('should throw BadRequestException if a campaign ID is invalid', async () => {
    await expect(
      (controller as any).validatecampaignRelations([invalidId]),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw NotFoundException if a campaign is not found', async () => {
    campaignModel.exec.mockResolvedValue(null);
    await expect(
      (controller as any).validatecampaignRelations([validId]),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw GoneException if a campaign is deleted', async () => {
    campaignModel.exec.mockResolvedValue({ deletedAt: new Date() });
    await expect(
      (controller as any).validatecampaignRelations([validId]),
    ).rejects.toThrow(GoneException);
  });

  it('should pass silently if campaign exists and is not deleted', async () => {
    campaignModel.exec.mockResolvedValue({ deletedAt: null });
    await expect(
      (controller as any).validatecampaignRelations([validId]),
    ).resolves.toBeUndefined();
  });

  it('should pass silently if campaignIds is empty or undefined', async () => {
    await expect(
      (controller as any).validatecampaignRelations([]),
    ).resolves.toBeUndefined();

    await expect(
      (controller as any).validatecampaignRelations(undefined),
    ).resolves.toBeUndefined();
  });
});