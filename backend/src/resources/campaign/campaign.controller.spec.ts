import { Test, TestingModule } from '@nestjs/testing';
import { CampaignController } from '@/resources/campaign/campaign.controller';
import { CampaignService } from '@/resources/campaign/campaign.service';
import { Types } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { Group } from '../group/schemas/group.schema';
import { Campaign } from './schemas/campaign.schema';
import { GroupService } from '../group/group.service';
import { BadRequestException, GoneException, NotFoundException } from '@nestjs/common';

describe('CampaignController - create', () => {
  let controller: CampaignController;
  let campaignService: any;
  let groupModel: any;

  const userId = new Types.ObjectId();
  const requestMock = { user: { userId } };

  const groupMainId = new Types.ObjectId().toHexString();
  const groupNpcId = new Types.ObjectId().toHexString();
  const groupArchivedId = new Types.ObjectId().toHexString();

  const createDto = {
    label: 'Test',
    description: 'Desc',
    groups: {
      main: [groupMainId],
      npc: [groupNpcId],
      archived: [groupArchivedId],
    },
  };

  beforeEach(async () => {
    campaignService = {
      create: jest.fn(),
    };

    groupModel = {
      findById: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue({ deletedAt: null }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CampaignController],
      providers: [
        { provide: CampaignService, useValue: campaignService },
        { provide: GroupService, useValue: {} },
        {
          provide: getModelToken(Group.name),
          useValue: groupModel,
        },
        {
          provide: getModelToken(Campaign.name),
          useValue: {}, // not used here
        },
      ],
    }).compile();

    controller = module.get<CampaignController>(CampaignController);
  });

  it('should create a campaign after validating groups', async () => {
    campaignService.create.mockResolvedValue({ data: 'createdCampaign' });

    const result = await controller.create(requestMock, createDto);

    expect(groupModel.findById).toHaveBeenCalledTimes(3);
    expect(campaignService.create).toHaveBeenCalledWith(createDto, userId);
    expect(result).toEqual({ data: 'createdCampaign' });
  });

  it('should throw BadRequestException if group ID is invalid', async () => {
    const invalidDto = { ...createDto, groups: { ...createDto.groups, main: ['invalid-id'] } };

    await expect(controller.create(requestMock, invalidDto)).rejects.toThrow(BadRequestException);
  });

  it('should throw GoneException if group is deleted', async () => {
    groupModel.exec.mockResolvedValue({ deletedAt: new Date() });

    await expect(controller.create(requestMock, createDto)).rejects.toThrow(GoneException);
  });

  it('should throw NotFoundException if group not found', async () => {
    groupModel.exec.mockResolvedValue(null);

    await expect(controller.create(requestMock, createDto)).rejects.toThrow(NotFoundException);
  });
});

describe('CampaignController - findAll', () => {
  let controller: CampaignController;
  let campaignService: any;

  beforeEach(async () => {
    campaignService = {
      findAllByUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CampaignController],
      providers: [
        { provide: CampaignService, useValue: campaignService },
        { provide: GroupService, useValue: {} },
        {
          provide: getModelToken(Group.name),
          useValue: {},
        },
        {
          provide: getModelToken(Campaign.name),
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<CampaignController>(CampaignController);
  });

  it('should return all campaigns for user with query options', async () => {
    const mockReq = { user: { userId: 'userId123' } };
    const mockResult = { data: ['campaign1'], message: 'ok' };

    campaignService.findAllByUser.mockResolvedValue(mockResult);

    const result = await controller.findAll(
      mockReq,
      1,
      20,
      '-updatedAt',
      'My Campaign'
    );

    expect(campaignService.findAllByUser).toHaveBeenCalledWith('userId123', {
      page: 1,
      offset: 20,
      sort: '-updatedAt',
      label: 'My Campaign',
    });
    expect(result).toBe(mockResult);
  });
});

describe('CampaignController - findOne', () => {
  let controller: CampaignController;
  let campaignService: any;
  let campaignModel: any;

  const campaignId = new Types.ObjectId();

  beforeEach(async () => {
    campaignService = {
      findOne: jest.fn(),
    };

    campaignModel = {
      findById: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue({ deletedAt: null }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CampaignController],
      providers: [
        { provide: CampaignService, useValue: campaignService },
        { provide: GroupService, useValue: {} },
        { provide: getModelToken(Campaign.name), useValue: campaignModel },
        { provide: getModelToken(Group.name), useValue: {} },
      ],
    }).compile();

    controller = module.get<CampaignController>(CampaignController);
  });

  it('should return campaign if found and not deleted', async () => {
    const mockData = { _id: campaignId };
    campaignService.findOne.mockResolvedValue(mockData);

    const result = await controller.findOne(campaignId);

    expect(campaignModel.findById).toHaveBeenCalled();
    expect(campaignService.findOne).toHaveBeenCalledWith(campaignId);
    expect(result).toBe(mockData);
  });
});

describe('CampaignController - update', () => {
  let controller: CampaignController;
  let campaignService: any;
  let campaignModel: any;
  let groupModel: any;

  const campaignId = new Types.ObjectId();
  const groupId = new Types.ObjectId().toHexString();

  const updateDto = {
    label: 'Updated Campaign',
    groups: {
      main: [groupId],
      npc: [],
      archived: [],
    },
  };

  beforeEach(async () => {
    campaignService = {
      update: jest.fn(),
    };

    campaignModel = {
      findById: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue({ _id: campaignId, deletedAt: null }),
    };

    groupModel = {
      findById: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue({ deletedAt: null }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CampaignController],
      providers: [
        { provide: CampaignService, useValue: campaignService },
        { provide: GroupService, useValue: {} },
        { provide: getModelToken(Campaign.name), useValue: campaignModel },
        { provide: getModelToken(Group.name), useValue: groupModel },
      ],
    }).compile();

    controller = module.get<CampaignController>(CampaignController);
  });

  it('should update campaign after validating resources', async () => {
    campaignService.update.mockResolvedValue({ data: 'updated' });

    const result = await controller.update(campaignId, updateDto);

    expect(groupModel.findById).toHaveBeenCalled();
    expect(campaignService.update).toHaveBeenCalledWith(campaignId, updateDto);
    expect(result).toEqual({ data: 'updated' });
  });
});

describe('CampaignController - remove', () => {
  let controller: CampaignController;
  let campaignService: any;
  let campaignModel: any;

  const campaignId = new Types.ObjectId();

  beforeEach(async () => {
    campaignService = {
      remove: jest.fn(),
    };

    campaignModel = {
      findById: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue({ deletedAt: null }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CampaignController],
      providers: [
        { provide: CampaignService, useValue: campaignService },
        { provide: GroupService, useValue: {} },
        { provide: getModelToken(Campaign.name), useValue: campaignModel },
        { provide: getModelToken(Group.name), useValue: {} },
      ],
    }).compile();

    controller = module.get<CampaignController>(CampaignController);
  });

  it('should remove campaign after validation', async () => {
    campaignService.remove.mockResolvedValue({ data: 'deleted' });

    const result = await controller.remove(campaignId);

    expect(campaignModel.findById).toHaveBeenCalled();
    expect(campaignService.remove).toHaveBeenCalledWith(campaignId);
    expect(result).toEqual({ data: 'deleted' });
  });
});

describe('CampaignController - findAllGroups', () => {
  let controller: CampaignController;
  let campaignService: any;
  let groupService: any;

  const userId = new Types.ObjectId().toHexString();
  const campaignId = new Types.ObjectId();

  const requestMock = { user: { userId } };

  beforeEach(async () => {
    campaignService = {
      findOne: jest.fn(),
    };

    groupService = {
      findAllByUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CampaignController],
      providers: [
        { provide: CampaignService, useValue: campaignService },
        { provide: GroupService, useValue: groupService },
        { provide: getModelToken(Campaign.name), useValue: {} },
        { provide: getModelToken(Group.name), useValue: {} },
      ],
    }).compile();

    controller = module.get<CampaignController>(CampaignController);
  });

  it('should return groups for the campaign and user', async () => {
    campaignService.findOne.mockResolvedValue({ data: { _id: campaignId } });
    groupService.findAllByUser.mockResolvedValue(['group1']);

    const result = await controller.findAllGroups(
      requestMock,
      campaignId,
      1,
      10,
      '-createdAt',
      'test',
      'main',
      true
    );

    expect(campaignService.findOne).toHaveBeenCalledWith(campaignId);
    expect(groupService.findAllByUser).toHaveBeenCalledWith(userId, {
      page: 1,
      offset: 10,
      sort: '-createdAt',
      label: 'test',
      onlyWithMembers: true,
    }, campaignId.toHexString(), 'main');

    expect(result).toEqual(['group1']);
  });

  it('should return undefined if campaign is not found', async () => {
    campaignService.findOne.mockResolvedValue({ data: null });

    const result = await controller.findAllGroups(requestMock, campaignId);

    expect(result).toBeUndefined();
    expect(groupService.findAllByUser).not.toHaveBeenCalled();
  });
});

describe('CampaignController - validateResource', () => {
  let controller: CampaignController;
  let campaignModel: any;

  const validId = new Types.ObjectId();
  const invalidId = 'not-a-valid-id';

  beforeEach(async () => {
    campaignModel = {
      findById: jest.fn().mockReturnThis(),
      exec: jest.fn(),
    };

    const module = await Test.createTestingModule({
      controllers: [CampaignController],
      providers: [
        { provide: CampaignService, useValue: {} },
        { provide: GroupService, useValue: {} },
        { provide: getModelToken(Campaign.name), useValue: campaignModel },
        { provide: getModelToken(Group.name), useValue: {} },
      ],
    }).compile();

    controller = module.get(CampaignController);
  });

  it('should throw BadRequestException if id is not a valid ObjectId', async () => {
    await expect(
      (controller as any).validateResource(invalidId),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw NotFoundException if campaign is not found', async () => {
    campaignModel.exec.mockResolvedValue(null);

    await expect(
      (controller as any).validateResource(validId),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw GoneException if campaign is soft-deleted', async () => {
    campaignModel.exec.mockResolvedValue({ deletedAt: new Date() });

    await expect(
      (controller as any).validateResource(validId),
    ).rejects.toThrow(GoneException);
  });

  it('should pass silently if campaign exists and is not deleted', async () => {
    campaignModel.exec.mockResolvedValue({ deletedAt: null });

    await expect(
      (controller as any).validateResource(validId),
    ).resolves.toBeUndefined();
  });
});