import { Test, TestingModule } from '@nestjs/testing';
import { GroupService } from '@/resources/group/group.service';
import { getModelToken } from '@nestjs/mongoose';
import { Group } from '@/resources/group/schemas/group.schema';
import { Campaign } from '@/resources/campaign/schemas/campaign.schema';
import { Character } from '@/resources/character/core/schemas/character.schema';
import { Types } from 'mongoose';
import { InternalServerErrorException, NotFoundException } from '@nestjs/common';
import type { CreateGroupDto } from '@/resources/group/dto/create-group.dto';
import type { UpdateGroupDto } from '@/resources/group/dto/update-group.dto';

describe('GroupService', () => {
  let service: GroupService;
  let groupModel: any;
  let campaignModel: any;
  let characterModel: any;

  const userId = new Types.ObjectId().toHexString();

  const createDto: CreateGroupDto = {
    label: 'Test Group',
    description: 'Description',
    characters: [new Types.ObjectId().toHexString()],
    campaigns: [{ idCampaign: new Types.ObjectId().toHexString(), type: 'main' }],
  };

  const updateDto: UpdateGroupDto = {
    label: 'Updated Group',
    description: 'Updated Desc',
    characters: [new Types.ObjectId().toHexString()],
    campaigns: [{ idCampaign: new Types.ObjectId().toHexString(), type: 'main' }],
  };

  beforeEach(async () => {
    groupModel = {
      create: jest.fn(),
      find: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      countDocuments: jest.fn(),
      findById: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn(),
      updateOne: jest.fn().mockReturnThis(),
    };
    campaignModel = {
      findById: jest.fn(),
      updateMany: jest.fn(),
      lean: jest.fn(),
    };
    characterModel = {
      updateMany: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GroupService,
        { provide: getModelToken(Group.name), useValue: groupModel },
        { provide: getModelToken(Campaign.name), useValue: campaignModel },
        { provide: getModelToken(Character.name), useValue: characterModel },
      ],
    }).compile();

    service = module.get<GroupService>(GroupService);
  });

  describe('create', () => {
    it('should create group and update characters and campaigns', async () => {
      groupModel.create.mockResolvedValue({ _id: 'groupId', ...createDto });
      characterModel.updateMany.mockResolvedValue({});
      campaignModel.updateMany.mockResolvedValue({});
      const loggerSpy = jest.spyOn(service['logger'], 'verbose').mockImplementation(() => { });

      const result = await service.create(createDto, userId);

      expect(groupModel.create).toHaveBeenCalledWith({
        label: createDto.label,
        description: createDto.description,
        characters: createDto.characters,
        campaigns: createDto.campaigns.map(c => c.idCampaign),
        createdBy: expect.any(Types.ObjectId),
      });
      expect(characterModel.updateMany).toHaveBeenCalledWith(
        { _id: { $in: createDto.characters } },
        { $addToSet: { groups: 'groupId' } }
      );
      expect(campaignModel.updateMany).toHaveBeenCalled();

      expect(loggerSpy).toHaveBeenCalledWith(expect.stringMatching(/Group created in \d+ms/), service['SERVICE_NAME']);

      expect(result).toEqual({
        message: expect.stringMatching(/Group created in \d+ms/),
        data: { _id: 'groupId', ...createDto },
      });

      loggerSpy.mockRestore();
    });

    it('should handle create when characters is undefined', async () => {
      const dtoWithoutCharacters = {
        label: 'No Characters Group',
        description: 'test',
        campaigns: [{ idCampaign: new Types.ObjectId().toHexString(), type: 'main' as const }],
      };

      groupModel.create.mockResolvedValue({ _id: 'groupId', ...dtoWithoutCharacters });
      characterModel.updateMany.mockResolvedValue({});
      campaignModel.updateMany.mockResolvedValue({});
      const loggerSpy = jest.spyOn(service['logger'], 'verbose').mockImplementation(() => { });

      const result = await service.create(dtoWithoutCharacters as any, userId);

      expect(groupModel.create).toHaveBeenCalledWith(expect.objectContaining({
        label: dtoWithoutCharacters.label,
        description: dtoWithoutCharacters.description,
        characters: [],
        campaigns: dtoWithoutCharacters.campaigns.map(c => c.idCampaign),
        createdBy: expect.any(Types.ObjectId),
      }));

      expect(result).toHaveProperty('data');
      loggerSpy.mockRestore();
    });

    it('create should extract characters and campaigns', async () => {
      // Arrange
      const groupCreateSpy = jest.fn().mockResolvedValue({ _id: 'groupId', ...createDto });
      groupModel.create = groupCreateSpy;
      characterModel.updateMany.mockResolvedValue({});
      campaignModel.updateMany.mockResolvedValue({});
      const customCreateDto = {
        label: 'Group test',
        description: 'desc',
        characters: [new Types.ObjectId().toHexString(), new Types.ObjectId().toHexString()],
        campaigns: [
          { idCampaign: new Types.ObjectId().toHexString(), type: 'main' as const },
          { idCampaign: new Types.ObjectId().toHexString(), type: 'npc' as const }
        ]
      };
      const expectedCharacters = customCreateDto.characters;
      const expectedCampaigns = customCreateDto.campaigns.map(c => c.idCampaign);
      // Act
      await service.create(customCreateDto, userId);
      // Assert
      expect(groupCreateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          label: customCreateDto.label,
          description: customCreateDto.description,
          characters: expectedCharacters,
          campaigns: expectedCampaigns,
          createdBy: expect.any(Types.ObjectId),
        })
      );
    });

    it('should throw InternalServerErrorException on error', async () => {
      groupModel.create.mockRejectedValue(new Error('DB error'));
      const loggerSpy = jest.spyOn(service['logger'], 'error').mockImplementation(() => { });

      await expect(service.create(createDto, userId)).rejects.toThrow(InternalServerErrorException);
      expect(loggerSpy).toHaveBeenCalledWith(expect.stringMatching(/Error while creating group: DB error/), null, service['SERVICE_NAME']);

      loggerSpy.mockRestore();
    });
  });

  describe('findAllByUser', () => {
    it('should extract all groupIds when type is all', async () => {
      const campaignId = new Types.ObjectId().toHexString();
      const mainGroups = [new Types.ObjectId(), new Types.ObjectId()];
      const npcGroups = [new Types.ObjectId()];
      const archivedGroups = [new Types.ObjectId()];

      campaignModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          _id: campaignId,
          groups: {
            main: mainGroups,
            npc: npcGroups,
            archived: archivedGroups,
          },
        }),
      });

      groupModel.find.mockReturnThis();
      groupModel.sort.mockReturnThis();
      groupModel.limit.mockReturnThis();
      groupModel.skip.mockReturnThis();
      groupModel.exec = jest.fn().mockResolvedValue([createDto]);
      groupModel.countDocuments.mockResolvedValue(1);

      let filtersArg = null;
      groupModel.find = jest.fn((filters) => {
        filtersArg = filters;
        return groupModel;
      });

      await service.findAllByUser(
        new Types.ObjectId(userId),
        { page: 1, offset: 10 },
        campaignId,
        'all'
      );

      const expectedGroupIds = [
        ...mainGroups,
        ...npcGroups,
        ...archivedGroups,
      ].map(id => id.toString());

      expect(filtersArg).toHaveProperty('_id');
      expect(filtersArg._id).toEqual({ $in: expectedGroupIds });
    });
    it('should find groups with filters and pagination', async () => {
      campaignModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          groups: { main: [new Types.ObjectId()], npc: [], archived: [] }
        }),
      });
      groupModel.find.mockReturnThis();
      groupModel.sort.mockReturnThis();
      groupModel.limit.mockReturnThis();
      groupModel.skip.mockReturnThis();
      groupModel.exec = jest.fn().mockResolvedValue([createDto]);

      groupModel.countDocuments.mockResolvedValue(1);

      const loggerSpy = jest.spyOn(service['logger'], 'verbose').mockImplementation(() => { });

      const result = await service.findAllByUser(
        new Types.ObjectId(userId),
        { page: 1, offset: 10, label: '', sort: 'updatedAt', onlyWithMembers: 'false' },
        undefined,
        'all'
      );

      expect(groupModel.find).toHaveBeenCalled();
      expect(groupModel.sort).toHaveBeenCalled();
      expect(groupModel.limit).toHaveBeenCalledWith(10);
      expect(groupModel.skip).toHaveBeenCalledWith(0);
      expect(groupModel.countDocuments).toHaveBeenCalled();

      expect(loggerSpy).toHaveBeenCalledWith(expect.stringMatching(/Groups found in \d+ms/));

      expect(result).toEqual({
        message: expect.stringMatching(/Groups found in \d+ms/),
        data: expect.any(Array),
        pagination: { page: 1, offset: 10, total: 1 }
      });

      loggerSpy.mockRestore();
    });

    it('should filter only groups with members', async () => {
      groupModel.find.mockReturnThis();
      groupModel.sort.mockReturnThis();
      groupModel.limit.mockReturnThis();
      groupModel.skip.mockReturnThis();
      groupModel.exec = jest.fn().mockResolvedValue([createDto]);
      groupModel.countDocuments.mockResolvedValue(1);
      // Spy to capture the filters argument
      let filtersArg = null;
      groupModel.find = jest.fn((filters) => {
        filtersArg = filters;
        return groupModel;
      });
      await service.findAllByUser(
        new Types.ObjectId(userId),
        { page: 1, offset: 10, onlyWithMembers: 'true' }
      );
      expect(filtersArg).toBeDefined();
      expect(filtersArg).toHaveProperty('characters');
      expect(filtersArg.characters).toEqual({ $ne: [] });
    });

    it('should extract groupIds by type when campaignId and type are provided', async () => {
      const mainGroups = [new Types.ObjectId(), new Types.ObjectId()];
      const npcGroups = [new Types.ObjectId(), new Types.ObjectId()];
      const expectedNpcGroupIds = npcGroups.map(id => id.toString());
      const archivedGroups = [new Types.ObjectId()];
      const campaignId = new Types.ObjectId().toHexString();
      // Mock campaignModel.findById().lean()
      campaignModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          _id: campaignId,
          groups: {
            main: mainGroups,
            npc: npcGroups,
            archived: archivedGroups,
          }
        }),
      });
      groupModel.find.mockReturnThis();
      groupModel.sort.mockReturnThis();
      groupModel.limit.mockReturnThis();
      groupModel.skip.mockReturnThis();
      groupModel.exec = jest.fn().mockResolvedValue([createDto]);
      groupModel.countDocuments.mockResolvedValue(1);
      let filtersArg = null;
      groupModel.find = jest.fn((filters) => {
        filtersArg = filters;
        return groupModel;
      });
      await service.findAllByUser(
        new Types.ObjectId(userId),
        { page: 1, offset: 10 },
        campaignId,
        'npc'
      );
      expect(filtersArg).toBeDefined();
      expect(filtersArg).toHaveProperty('_id');
      expect(filtersArg._id).toEqual({ $in: expectedNpcGroupIds });
      expect(filtersArg._id.$in.every(id => typeof id === 'string')).toBe(true);
    });

    it('should handle sort with descending order', async () => {
      groupModel.find.mockReturnThis();
      groupModel.sort.mockReturnThis();
      groupModel.limit.mockReturnThis();
      groupModel.skip.mockReturnThis();
      groupModel.exec = jest.fn().mockResolvedValue([createDto]);
      groupModel.countDocuments.mockResolvedValue(1);
      // Spy on sort
      const sortSpy = jest.spyOn(groupModel, 'sort');
      await service.findAllByUser(
        new Types.ObjectId(userId),
        { page: 1, offset: 10, sort: '-createdAt' }
      );
      expect(sortSpy).toHaveBeenCalledWith(expect.objectContaining({ createdAt: 'desc' }));
    });

    it('should throw NotFoundException if campaign not found', async () => {
      campaignModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });
      const loggerSpy = jest.spyOn(service['logger'], 'error').mockImplementation(() => { });

      await expect(service.findAllByUser(
        new Types.ObjectId(userId),
        { page: 1, offset: 10 },
        'nonexistentCampaignId'
      )).rejects.toThrow(NotFoundException);

      expect(loggerSpy).toHaveBeenCalled();

      loggerSpy.mockRestore();
    });

    it('should throw InternalServerErrorException on error', async () => {
      // Simule une erreur lors de l'exécution de la requête groupModel.exec()
      groupModel.find.mockReturnThis();
      groupModel.sort.mockReturnThis();
      groupModel.limit.mockReturnThis();
      groupModel.skip.mockReturnThis();
      groupModel.exec = jest.fn().mockRejectedValue(new Error('DB fail'));
      groupModel.countDocuments.mockResolvedValue(0);
      const loggerSpy = jest.spyOn(service['logger'], 'error').mockImplementation(() => { });

      await expect(service.findAllByUser(
        new Types.ObjectId(userId),
        { page: 1, offset: 10 }
      )).rejects.toThrow(InternalServerErrorException);

      expect(loggerSpy).toHaveBeenCalled();

      loggerSpy.mockRestore();
    });
  });

  describe('findOne', () => {
    it('should find one group and populate relations', async () => {
      groupModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue({ _id: 'groupId' }),
      });

      const loggerSpy = jest.spyOn(service['logger'], 'verbose').mockImplementation(() => { });

      const result = await service.findOne(new Types.ObjectId('507f1f77bcf86cd799439011'));

      expect(groupModel.findById).toHaveBeenCalled();
      expect(result).toEqual({
        message: expect.stringMatching(/Group #.* found in \d+ms/),
        data: { _id: 'groupId' },
      });

      loggerSpy.mockRestore();
    });

    it('should throw InternalServerErrorException on error', async () => {
      groupModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockRejectedValue(new Error('DB fail')),
      });

      const loggerSpy = jest.spyOn(service['logger'], 'error').mockImplementation(() => { });

      await expect(service.findOne(new Types.ObjectId('507f1f77bcf86cd799439011'))).rejects.toThrow(InternalServerErrorException);

      expect(loggerSpy).toHaveBeenCalled();

      loggerSpy.mockRestore();
    });
  });

  describe('update', () => {
    it('should update group data and sync characters and campaigns', async () => {
      const id = new Types.ObjectId();
      const existingGroup = {
        _id: id,
        characters: [{ _id: new Types.ObjectId() }],
        campaigns: [{ _id: new Types.ObjectId() }],
      };
      groupModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue({
          campaigns: existingGroup.campaigns || [],
          characters: existingGroup.characters || [],
          ...existingGroup,
        }),
      });
      groupModel.updateOne.mockReturnValue({ exec: jest.fn().mockResolvedValue({ modifiedCount: 1 }) });
      characterModel.updateMany.mockResolvedValue({});
      campaignModel.updateMany.mockResolvedValue({});
      const loggerSpy = jest.spyOn(service['logger'], 'verbose').mockImplementation(() => { });

      const result = await service.update(id, updateDto);

      expect(groupModel.updateOne).toHaveBeenCalled();
      expect(characterModel.updateMany).toHaveBeenCalled();
      expect(campaignModel.updateMany).toHaveBeenCalled();
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('data');

      loggerSpy.mockRestore();
    });

    it('should throw NotFoundException if update modifies no document', async () => {
      const id = new Types.ObjectId();
      groupModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue({
          campaigns: [],
          characters: [],
        }),
      });
      groupModel.updateOne.mockReturnValue({ exec: jest.fn().mockResolvedValue({ modifiedCount: 0 }) });
      const loggerSpy = jest.spyOn(service['logger'], 'error').mockImplementation(() => { });

      await expect(service.update(id, updateDto)).rejects.toThrow(NotFoundException);

      expect(loggerSpy).toHaveBeenCalled();

      loggerSpy.mockRestore();
    });

    it('should throw InternalServerErrorException on other errors', async () => {
      const id = new Types.ObjectId();
      groupModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockRejectedValue(new Error('DB error')),
      });
      const loggerSpy = jest.spyOn(service['logger'], 'error').mockImplementation(() => { });

      await expect(service.update(id, updateDto)).rejects.toThrow(InternalServerErrorException);

      expect(loggerSpy).toHaveBeenCalled();

      loggerSpy.mockRestore();
    });
  });

  describe('remove', () => {
    it('should soft delete group and unlink characters', async () => {
      const id = new Types.ObjectId();
      const mockGroup = {
        _id: id,
        characters: [new Types.ObjectId(), new Types.ObjectId()],
        save: jest.fn(),
      };
      groupModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockGroup),
      });
      characterModel.updateMany.mockReturnValue({ exec: jest.fn().mockResolvedValue({}) });
      const loggerSpy = jest.spyOn(service['logger'], 'verbose').mockImplementation(() => { });

      const result = await service.remove(id);

      expect(characterModel.updateMany).toHaveBeenCalled();
      expect(mockGroup.save).toHaveBeenCalled();
      expect(result).toHaveProperty('message');
      expect(result.data).toBe(mockGroup);

      loggerSpy.mockRestore();
    });

    it('should throw InternalServerErrorException on error', async () => {
      const id = new Types.ObjectId();
      groupModel.findById.mockReturnValue({
        exec: jest.fn().mockRejectedValue(new Error('DB fail')),
      });
      const loggerSpy = jest.spyOn(service['logger'], 'error').mockImplementation(() => { });

      await expect(service.remove(id)).rejects.toThrow(InternalServerErrorException);

      expect(loggerSpy).toHaveBeenCalled();

      loggerSpy.mockRestore();
    });
  });
});
