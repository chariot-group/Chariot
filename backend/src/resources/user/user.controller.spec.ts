import { UserDocument } from '@/resources/user/schemas/user.schema';
import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from '@/resources/user/user.controller';
import { UserService } from '@/resources/user/user.service';
import { getModelToken } from '@nestjs/mongoose';
import { User } from '@/resources/user/schemas/user.schema';
import { Campaign } from '@/resources/campaign/schemas/campaign.schema';
import { Types } from 'mongoose';
import { BadRequestException, NotFoundException, GoneException } from '@nestjs/common';

describe('UserController', () => {
  let controller: UserController;
  let userService: UserService;

  const mockUserModel = {
    findById: jest.fn(),
  };
  const mockCampaignModel = {
    findById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: {
            update: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn(),
          },
        },
        { provide: getModelToken(User.name), useValue: mockUserModel },
        { provide: getModelToken(Campaign.name), useValue: mockCampaignModel },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    userService = module.get<UserService>(UserService);

    jest.clearAllMocks();
  });

  describe('update', () => {
    const userId = new Types.ObjectId();
    const updateUserDto = {
      username: 'newusername',
      campaigns: ['campaignId1', 'campaignId2'],
    };

    it('should update user successfully', async () => {
      // mock user exists and not deleted
      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ deletedAt: null }),
      });

      // mock all campaigns valid and not deleted
      mockCampaignModel.findById.mockImplementation((id) => ({
        exec: jest.fn().mockResolvedValue({ _id: id, deletedAt: null }),
      }));

      // mock service update
      (userService.update as jest.Mock).mockResolvedValue({
        message: 'User updated',
        data: { id: userId, ...updateUserDto },
      });

      const result = await controller.update(userId, updateUserDto as any);

      expect(mockUserModel.findById).toHaveBeenCalledWith(userId);
      expect(mockCampaignModel.findById).toHaveBeenCalledTimes(updateUserDto.campaigns.length);
      expect(userService.update).toHaveBeenCalledWith(userId, updateUserDto);
      expect(result).toEqual({
        message: 'User updated',
        data: { id: userId, ...updateUserDto },
      });
    });

    it('should throw BadRequestException if updateUserDto is empty', async () => {
      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ deletedAt: null }),
      });

      await expect(controller.update(userId, {})).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if campaign IDs invalid', async () => {
      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ deletedAt: null }),
      });

      // One campaign is invalid (null)
      mockCampaignModel.findById.mockImplementation((id) => ({
        exec: jest.fn().mockResolvedValue(id === 'invalid' ? null : { _id: id, deletedAt: null }),
      }));

      const dto = {
        campaigns: ['valid1', 'invalid'],
      };

      await expect(controller.update(userId, dto as any)).rejects.toThrow(BadRequestException);
    });

    it('should throw GoneException if user is deleted', async () => {
      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ deletedAt: new Date() }),
      });

      await expect(controller.update(userId, updateUserDto as any)).rejects.toThrow(GoneException);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(controller.update(userId, updateUserDto as any)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if id is not a valid ObjectId', async () => {
      // Simuler Types.ObjectId.isValid pour renvoyer false
      jest.spyOn(require('mongoose').Types.ObjectId, 'isValid').mockReturnValue(false);

      const invalidId = 'invalid-id' as any;

      await expect(controller.update(invalidId, { username: 'test' })).rejects.toThrow(BadRequestException);

      // Restaurer le mock
      jest.spyOn(require('mongoose').Types.ObjectId, 'isValid').mockRestore();
    });

    it('should throw GoneException if any campaign is gone', async () => {
      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ deletedAt: null }),
      });

      // Une campagne est supprimée (deletedAt non null)
      mockCampaignModel.findById.mockImplementation((id) => ({
        exec: jest.fn().mockResolvedValue(id === 'gone' ? { _id: id, deletedAt: new Date() } : { _id: id, deletedAt: null }),
      }));

      const dto = {
        campaigns: ['valid1', 'gone'],
      };

      await expect(controller.update(new Types.ObjectId(), dto as any)).rejects.toThrow(GoneException);
    });
  });

  describe('findAll', () => {
    it('should call userService.findAll and return result', async () => {
      const query = { page: 1, offset: 10, sort: 'asc', email: 'test@example.com' };

      const mockUser1: Partial<UserDocument> = {
        _id: new Types.ObjectId(),
        username: 'user1',
        email: 'user1@example.com',
      };

      const mockUser2: Partial<UserDocument> = {
        _id: new Types.ObjectId(),
        username: 'user2',
        email: 'user2@example.com',
      };

      const mockResult = {
        message: 'Users retrieved',
        data: [mockUser1, mockUser2],
        pagination: { page: 1, offset: 10, totalItems: 2 },
      };

      jest.spyOn(userService, 'findAll').mockResolvedValue(mockResult as any);

      const result = await controller.findAll(query.page, query.offset, query.sort, query.email);

      expect(userService.findAll).toHaveBeenCalledWith(query);
      expect(result).toBe(mockResult);
    });
  });

  describe('findOne', () => {
    it('should validate user and return user from service', async () => {
      const id = new Types.ObjectId();

      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ deletedAt: null }),
      });

      const mockUser: { message: string; data: Partial<UserDocument> } = {
        message: 'User found',
        data: {
          _id: new Types.ObjectId(),
          username: 'testuser',
          email: 'test@example.com',
        },
      };
      jest.spyOn(userService, 'findOne').mockResolvedValue(mockUser as any);

      const result = await controller.findOne(id);

      expect(mockUserModel.findById).toHaveBeenCalledWith(id);
      expect(userService.findOne).toHaveBeenCalledWith(id);
      expect(result).toBe(mockUser);
    });
  });

  describe('remove', () => {
    it('should validate user and call service remove', async () => {
      const id = new Types.ObjectId();

      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ deletedAt: null }),
      });

      jest.spyOn(userService, 'remove').mockResolvedValue({
        message: 'User removed',
        data: null,
      });

      const result = await controller.remove(id);

      expect(mockUserModel.findById).toHaveBeenCalledWith(id);
      expect(userService.remove).toHaveBeenCalledWith(id);
      expect(result).toEqual({
        message: 'User removed',
        data: null,
      });
    });
  });
});