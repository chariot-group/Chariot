import { Test, TestingModule } from '@nestjs/testing';
import { CampaignService } from './campaign.service';
import { getModelToken } from '@nestjs/mongoose';
import { Campaign } from './schemas/campaign.schema';
import { Group } from '@/resources/group/schemas/group.schema';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { Types } from 'mongoose';

describe('CampaignService - create', () => {
  let service: CampaignService;
  let campaignModel: any;
  let groupModel: any;

  const userId = new Types.ObjectId().toHexString();

  const mockCampaignDto = {
    label: 'Nouvelle campagne',
    description: 'Campagne test',
    groups: {
      main: ['group1'],
      npc: ['group2'],
      archived: ['group3'],
    },
  };

  const mockCreatedCampaign = {
    _id: new Types.ObjectId(),
    ...mockCampaignDto,
    createdBy: new Types.ObjectId(userId),
  };

  beforeEach(async () => {
    campaignModel = {
      create: jest.fn(),
    };
    groupModel = {
      updateMany: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CampaignService,
        { provide: getModelToken(Campaign.name), useValue: campaignModel },
        { provide: getModelToken(Group.name), useValue: groupModel },
      ],
    }).compile();

    service = module.get<CampaignService>(CampaignService);
  });

  it('should create a campaign and update related groups', async () => {
    campaignModel.create.mockResolvedValue(mockCreatedCampaign);
    groupModel.updateMany.mockResolvedValue({});

    const loggerSpy = jest.spyOn(service['logger'], 'verbose').mockImplementation(() => { });

    const result = await service.create(mockCampaignDto, userId);

    expect(campaignModel.create).toHaveBeenCalledWith({
      ...mockCampaignDto,
      createdBy: expect.any(Types.ObjectId),
    });

    expect(groupModel.updateMany).toHaveBeenCalledWith(
      { _id: { $in: ['group1', 'group2', 'group3'] } },
      { $addToSet: { campaigns: mockCreatedCampaign._id } },
    );

    expect(loggerSpy).toHaveBeenCalledWith(
      expect.stringMatching(/Campaign created in \d+ms/),
      'CampaignService',
    );

    expect(result).toEqual({
      message: expect.stringMatching(/Campaign created in \d+ms/),
      data: mockCreatedCampaign,
    });

    loggerSpy.mockRestore();
  });

  it('should handle errors and log them', async () => {
    campaignModel.create.mockRejectedValue(new Error('DB failure'));
    const loggerSpy = jest.spyOn(service['logger'], 'error').mockImplementation(() => { });

    await expect(service.create(mockCampaignDto, userId)).rejects.toThrow(
      InternalServerErrorException,
    );

    expect(loggerSpy).toHaveBeenCalledWith(
      expect.stringMatching(/Error while creating campaign: DB failure/),
      null,
      'CampaignService',
    );

    loggerSpy.mockRestore();
  });
});

describe('CampaignService - findAllByUser', () => {
  let service: CampaignService;
  let campaignModel: any;

  const userId = new Types.ObjectId().toHexString();
  const mockCampaign = {
    _id: new Types.ObjectId(),
    label: 'Test Campaign',
    groups: {
      main: [{ _id: 'g1' }],
      npc: [{ _id: 'g2' }],
      archived: [{ _id: 'g3' }],
    },
    toObject: function () {
      return { ...this };
    },
  };

  beforeEach(async () => {
    campaignModel = {
      countDocuments: jest.fn(),
      find: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CampaignService,
        { provide: getModelToken(Campaign.name), useValue: campaignModel },
        { provide: getModelToken(Group.name), useValue: {} }, // Pas utilisé ici
      ],
    }).compile();

    service = module.get<CampaignService>(CampaignService);
  });

  it('should return campaigns with pagination, sorting, and label filtering', async () => {
    campaignModel.countDocuments.mockResolvedValue(1);
    campaignModel.exec.mockResolvedValue([mockCampaign]);

    const result = await service.findAllByUser(userId, {
      page: 1,
      offset: 10,
      label: 'Test',
      sort: '-updatedAt',
    });

    expect(campaignModel.countDocuments).toHaveBeenCalledWith({
      label: { $regex: 'Test', $options: 'i' },
      deletedAt: { $eq: null },
      createdBy: new Types.ObjectId(userId),
    });

    expect(campaignModel.find).toHaveBeenCalled();
    expect(campaignModel.skip).toHaveBeenCalledWith(0);
    expect(campaignModel.limit).toHaveBeenCalledWith(10);
    expect(campaignModel.sort).toHaveBeenCalledWith({ updatedAt: -1 });

    expect(result).toEqual({
      message: expect.stringMatching(/Campaigns found in \d+ms/),
      data: [
        {
          ...mockCampaign,
          groups: {
            main: ['g1'],
            npc: ['g2'],
            archived: ['g3'],
          },
        },
      ],
      pagination: {
        page: 1,
        offset: 10,
        totalItems: 1,
      },
    });
  });

  it('should apply default pagination and empty label if not provided', async () => {
    campaignModel.countDocuments.mockResolvedValue(0);
    campaignModel.exec.mockResolvedValue([]);

    const result = await service.findAllByUser(userId, {});

    expect(campaignModel.skip).toHaveBeenCalledWith(0);
    expect(campaignModel.limit).toHaveBeenCalledWith(10);
    expect(result.pagination).toEqual({ page: 1, offset: 10, totalItems: 0 });
  });

  it('should throw InternalServerErrorException if query fails', async () => {
    campaignModel.countDocuments.mockRejectedValue(new Error('DB Fail'));

    await expect(service.findAllByUser(userId, {})).rejects.toThrow(
      InternalServerErrorException,
    );
  });
});

describe('CampaignService - findOne', () => {
  let service: CampaignService;
  let campaignModel: any;

  const mockCampaign = {
    _id: new Types.ObjectId(),
    label: 'Test Campaign',
    groups: {
      main: [],
      npc: [],
      archived: [],
    },
  };

  beforeEach(async () => {
    campaignModel = {
      findById: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CampaignService,
        { provide: getModelToken(Campaign.name), useValue: campaignModel },
        { provide: getModelToken(Group.name), useValue: {} },
      ],
    }).compile();

    service = module.get<CampaignService>(CampaignService);
  });

  it('should return a campaign with populated groups and log a success message', async () => {
    campaignModel.exec.mockResolvedValue(mockCampaign);

    const result = await service.findOne(mockCampaign._id);

    expect(campaignModel.findById).toHaveBeenCalledWith(mockCampaign._id);
    expect(campaignModel.populate).toHaveBeenCalledTimes(3);
    expect(campaignModel.exec).toHaveBeenCalled();

    expect(result).toEqual({
      message: expect.stringMatching(/Campaign #.* found in \d+ms/),
      data: mockCampaign,
    });
  });

  it('should throw InternalServerErrorException and log error if query fails', async () => {
    campaignModel.exec.mockRejectedValue(new Error('DB Error'));

    await expect(service.findOne(mockCampaign._id)).rejects.toThrow(
      InternalServerErrorException,
    );
  });
});

describe('CampaignService - update', () => {
  let service: CampaignService;
  let campaignModel: any;
  let groupModel: any;

  const campaignId = new Types.ObjectId();
  const existingCampaign = {
    _id: campaignId,
    label: 'Original Label',
    groups: {
      main: ['g1'],
      npc: [],
      archived: [],
    },
  };

  beforeEach(async () => {
    campaignModel = {
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn(),
    };
    groupModel = {
      updateMany: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CampaignService,
        { provide: getModelToken(Campaign.name), useValue: campaignModel },
        { provide: getModelToken(Group.name), useValue: groupModel },
      ],
    }).compile();

    service = module.get<CampaignService>(CampaignService);
  });

  it('should update campaign groups and data successfully', async () => {
    campaignModel.findById.mockResolvedValue(existingCampaign);
    groupModel.updateMany.mockResolvedValue({});
    campaignModel.exec.mockResolvedValue({ ...existingCampaign });

    const result = await service.update(campaignId, {
      groups: {
        main: ['g2'], // changement de groupe
        npc: [],
        archived: [],
      },
    });

    expect(groupModel.updateMany).toHaveBeenCalledTimes(2); // remove + add
    expect(campaignModel.findByIdAndUpdate).toHaveBeenCalled();
    expect(result).toHaveProperty('message');
    expect(result).toHaveProperty('data');
  });

  it('should reject update if label changes', async () => {
    campaignModel.findById.mockResolvedValue(existingCampaign);

    await expect(
      service.update(campaignId, { label: 'New Label' }),
    ).rejects.toThrow(BadRequestException);

    expect(groupModel.updateMany).not.toHaveBeenCalled();
    expect(campaignModel.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it('should throw InternalServerErrorException on unexpected error', async () => {
    campaignModel.findById.mockRejectedValue(new Error('DB fail'));

    await expect(service.update(campaignId, {})).rejects.toThrow(
      InternalServerErrorException,
    );
  });
});

describe('CampaignService - remove', () => {
  let service: CampaignService;
  let campaignModel: any;
  let groupModel: any;

  const campaignId = new Types.ObjectId();
  const campaign = {
    _id: campaignId,
    groups: {
      main: ['g1'],
      npc: [],
      archived: ['g2'],
    },
    save: jest.fn(),
  };

  beforeEach(async () => {
    campaignModel = {
      findById: jest.fn().mockReturnThis(),
      exec: jest.fn()
    };
    groupModel = {
      updateOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CampaignService,
        { provide: getModelToken(Campaign.name), useValue: campaignModel },
        { provide: getModelToken(Group.name), useValue: groupModel },
      ],
    }).compile();

    service = module.get<CampaignService>(CampaignService);
  });

  it('should remove campaign (soft delete) and unlink from groups', async () => {
    campaignModel.exec.mockResolvedValue(campaign);
    groupModel.updateOne.mockResolvedValue({});
    campaign.save.mockResolvedValue({});

    const result = await service.remove(campaignId);

    expect(groupModel.updateOne).toHaveBeenCalledTimes(2);
    expect(campaign.save).toHaveBeenCalled();
    expect(result).toHaveProperty('message');
    expect(result.data).toEqual(campaign);
  });

  it('should throw InternalServerErrorException if error occurs', async () => {
    await expect(service.remove(campaignId)).rejects.toThrow(
      InternalServerErrorException,
    );
  });
});