import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '@/resources/user/user.service';
import { getModelToken } from '@nestjs/mongoose';
import { User } from '@/resources/user/schemas/user.schema';
import { ConflictException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { UpdateUserDto } from '@/resources/user/dto/update-user.dto';
import { CreateUserDto } from '@/resources/user/dto/create-user.dto';

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
}));
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('UserService - create', () => {
  let service: UserService;
  let userModel: any;

  const mockCreateUserDto: CreateUserDto = {
    email: 'test@example.com',
    password: 'plainPassword',
    username: 'johndoe',
    campaigns: [],
  };

  const mockCreatedUser = {
    _id: new Types.ObjectId(),
    email: 'test@example.com',
    password: 'hashedPassword',
    username: 'johndoe',
    campaigns: [],
  };

  beforeEach(async () => {
    userModel = {
      findOne: jest.fn().mockReturnThis(),
      exec: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getModelToken(User.name), useValue: userModel },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should create a user with hashed password', async () => {
    userModel.exec.mockResolvedValue(null); // No existing user
    mockBcrypt.hash.mockResolvedValue('hashedPassword' as never);
    userModel.create.mockResolvedValue(mockCreatedUser);

    const loggerSpy = jest.spyOn(service['logger'], 'verbose').mockImplementation(() => { });

    const result = await service.create(mockCreateUserDto);

    expect(userModel.findOne).toHaveBeenCalledWith({ email: mockCreateUserDto.email });
    expect(mockBcrypt.hash).toHaveBeenCalledWith('plainPassword', 10);
    expect(userModel.create).toHaveBeenCalledWith({
      email: 'test@example.com',
      username: 'johndoe',
      password: 'hashedPassword',
      campaigns: [],
    });

    expect(loggerSpy).toHaveBeenCalledWith(
      expect.stringMatching(/User created in \d+ms/),
      'UserService',
    );

    expect(result).toEqual({
      message: expect.stringMatching(/User created in \d+ms/),
      data: mockCreatedUser,
    });

    loggerSpy.mockRestore();
  });

  it('should throw ConflictException if user already exists', async () => {
    userModel.exec.mockResolvedValue(mockCreatedUser); // User exists
    const loggerSpy = jest.spyOn(service['logger'], 'error').mockImplementation(() => { });

    await expect(service.create(mockCreateUserDto)).rejects.toThrow(
      ConflictException,
    );

    expect(loggerSpy).toHaveBeenCalledWith(
      expect.stringMatching(/User with email test@example.com already exists/),
      null,
      'UserService',
    );

    loggerSpy.mockRestore();
  });

  it('should handle errors and log them', async () => {
    userModel.exec.mockResolvedValue(null);
    mockBcrypt.hash.mockResolvedValue('hashedPassword' as never);
    userModel.create.mockRejectedValue(new Error('DB failure'));
    const loggerSpy = jest.spyOn(service['logger'], 'error').mockImplementation(() => { });

    await expect(service.create(mockCreateUserDto)).rejects.toThrow(
      InternalServerErrorException,
    );

    expect(loggerSpy).toHaveBeenCalledWith(
      expect.stringMatching(/Error while creating campaign: DB failure/),
      null,
      'UserService',
    );

    loggerSpy.mockRestore();
  });
});

describe('UserService - findAll', () => {
  let service: UserService;
  let userModel: any;

  const mockUser = {
    _id: new Types.ObjectId(),
    email: 'test@example.com',
    firstname: 'John',
    lastname: 'Doe',
  };

  beforeEach(async () => {
    userModel = {
      countDocuments: jest.fn(),
      find: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      exec: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getModelToken(User.name), useValue: userModel },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should return users with pagination, sorting, and email filtering', async () => {
    userModel.countDocuments.mockResolvedValue(1);
    userModel.exec.mockResolvedValue([mockUser]);

    const result = await service.findAll({
      page: 1,
      offset: 10,
      email: 'test',
      sort: '-updatedAt',
    });

    expect(userModel.countDocuments).toHaveBeenCalledWith({
      email: { $regex: 'test', $options: 'i' },
      deletedAt: { $eq: null },
    });

    expect(userModel.find).toHaveBeenCalled();
    expect(userModel.skip).toHaveBeenCalledWith(0);
    expect(userModel.limit).toHaveBeenCalledWith(10);
    expect(userModel.sort).toHaveBeenCalledWith({ updatedAt: -1 });

    expect(result).toEqual({
      message: expect.stringMatching(/Users found in \d+ms/),
      data: [mockUser],
      pagination: {
        page: 1,
        offset: 10,
        totalItems: 1,
      },
    });
  });

  it('should apply default pagination and empty email if not provided', async () => {
    userModel.countDocuments.mockResolvedValue(0);
    userModel.exec.mockResolvedValue([]);

    const result = await service.findAll({});

    expect(userModel.skip).toHaveBeenCalledWith(0);
    expect(userModel.limit).toHaveBeenCalledWith(10);
    expect(userModel.sort).toHaveBeenCalledWith({ updatedAt: 1 });
    expect(result.pagination).toEqual({ page: 1, offset: 10, totalItems: 0 });
  });

  it('should throw InternalServerErrorException if query fails', async () => {
    userModel.countDocuments.mockRejectedValue(new Error('DB Fail'));

    await expect(service.findAll({})).rejects.toThrow(
      InternalServerErrorException,
    );
  });
});

describe('UserService - findOne', () => {
  let service: UserService;
  let userModel: any;

  const mockUser = {
    _id: new Types.ObjectId(),
    email: 'test@example.com',
    firstname: 'John',
    lastname: 'Doe',
  };

  beforeEach(async () => {
    userModel = {
      findById: jest.fn().mockReturnThis(),
      exec: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getModelToken(User.name), useValue: userModel },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should return a user and log a success message', async () => {
    userModel.exec.mockResolvedValue(mockUser);

    const result = await service.findOne(mockUser._id);

    expect(userModel.findById).toHaveBeenCalledWith(mockUser._id);
    expect(userModel.exec).toHaveBeenCalled();

    expect(result).toEqual({
      message: expect.stringMatching(/User #.* found in \d+ms/),
      data: mockUser,
    });
  });

  it('should throw InternalServerErrorException and log error if query fails', async () => {
    userModel.exec.mockRejectedValue(new Error('DB Error'));

    await expect(service.findOne(mockUser._id)).rejects.toThrow(
      InternalServerErrorException,
    );
  });
});

describe('UserService - findByEmail', () => {
  let service: UserService;
  let userModel: any;

  const mockUser = {
    _id: new Types.ObjectId(),
    email: 'test@example.com',
    firstname: 'John',
    lastname: 'Doe',
    deletedAt: null,
  };

  beforeEach(async () => {
    userModel = {
      findOne: jest.fn().mockReturnThis(),
      exec: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getModelToken(User.name), useValue: userModel },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should return a user when found and not deleted', async () => {
    userModel.exec.mockResolvedValue(mockUser);

    const result = await service.findByEmail('test@example.com');

    expect(userModel.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
    expect(result).toEqual(mockUser);
  });

  it('should return null when user is not found', async () => {
    userModel.exec.mockResolvedValue(null);
    const loggerSpy = jest.spyOn(service['logger'], 'error').mockImplementation(() => { });

    const result = await service.findByEmail('nonexistent@example.com');

    expect(result).toBeNull();
    expect(loggerSpy).toHaveBeenCalledWith(
      expect.stringMatching(/User nonexistent@example.com not found/),
      null,
      'UserService',
    );

    loggerSpy.mockRestore();
  });

  it('should return null when user is deleted', async () => {
    const deletedUser = { ...mockUser, deletedAt: new Date() };
    userModel.exec.mockResolvedValue(deletedUser);
    const loggerSpy = jest.spyOn(service['logger'], 'error').mockImplementation(() => { });

    const result = await service.findByEmail('test@example.com');

    expect(result).toBeNull();
    expect(loggerSpy).toHaveBeenCalledWith(
      expect.stringMatching(/User test@example.com is gone/),
      null,
      'UserService',
    );

    loggerSpy.mockRestore();
  });

  it('should return null on database error', async () => {
    userModel.exec.mockRejectedValue(new Error('DB Error'));
    const loggerSpy = jest.spyOn(service['logger'], 'error').mockImplementation(() => { });

    const result = await service.findByEmail('test@example.com');

    expect(result).toBeNull();
    expect(loggerSpy).toHaveBeenCalledWith(
      expect.stringMatching(/Error while getting user: DB Error/),
      null,
      'UserService',
    );

    loggerSpy.mockRestore();
  });
});

describe('UserService - update', () => {
  let service: UserService;
  let userModel: any;

  const userId = new Types.ObjectId();
  const mockUser = {
    _id: userId,
    email: 'test@example.com',
    username: 'johndoe',
    password: 'hashedPassword',
    campaigns: [],
    subscriptions: [],
  };

  const updateUserDto: UpdateUserDto = {
    username: 'janesmith',
    email: 'jane@example.com',
    password: 'newPassword123',
    campaigns: [],
    subscriptions: [],
  };

  beforeEach(async () => {
    userModel = {
      updateOne: jest.fn().mockReturnThis(),
      findById: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getModelToken(User.name), useValue: userModel },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should update user successfully', async () => {
    userModel.exec
      .mockResolvedValueOnce({ modifiedCount: 1 }) // updateOne result
      .mockResolvedValueOnce({ ...mockUser, ...updateUserDto }); // findById result

    const result = await service.update(userId, updateUserDto);

    expect(userModel.updateOne).toHaveBeenCalledWith({ _id: userId }, updateUserDto);
    expect(userModel.findById).toHaveBeenCalledWith(userId);
    expect(userModel.populate).toHaveBeenCalledWith('campaigns');

    expect(result).toEqual({
      message: expect.stringMatching(/User #.* update in \d+ms/),
      data: { ...mockUser, ...updateUserDto },
    });
  });

  it('should throw NotFoundException if user is not found', async () => {
    userModel.exec
      .mockResolvedValueOnce({ modifiedCount: 0 }) // updateOne result
      .mockResolvedValueOnce(null); // findById result

    const loggerSpy = jest.spyOn(service['logger'], 'error').mockImplementation(() => { });

    await expect(service.update(userId, updateUserDto)).rejects.toThrow(
      NotFoundException,
    );

    expect(loggerSpy).toHaveBeenCalledWith(
      expect.stringMatching(/User #.* not found/),
      null,
      'UserService',
    );

    loggerSpy.mockRestore();
  });

  it('should throw InternalServerErrorException on unexpected error', async () => {
    userModel.exec.mockRejectedValue(new Error('DB fail'));

    await expect(service.update(userId, updateUserDto)).rejects.toThrow(
      InternalServerErrorException,
    );
  });
});

describe('UserService - remove', () => {
  let service: UserService;
  let userModel: any;

  const userId = new Types.ObjectId();
  const user = {
    _id: userId,
    email: 'test@example.com',
    firstname: 'John',
    lastname: 'Doe',
    deletedAt: null,
    save: jest.fn(),
  };

  beforeEach(async () => {
    userModel = {
      findById: jest.fn().mockReturnThis(),
      exec: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getModelToken(User.name), useValue: userModel },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should remove user (soft delete)', async () => {
    userModel.exec.mockResolvedValue(user);
    user.save.mockResolvedValue({});

    const result = await service.remove(userId);

    expect(userModel.findById).toHaveBeenCalledWith(userId);
    expect(user.save).toHaveBeenCalled();
    expect(user.deletedAt).toBeInstanceOf(Date);

    expect(result).toEqual({
      message: expect.stringMatching(/User #.* delete in \d+ms/),
      data: user,
    });
  });

  it('should throw InternalServerErrorException if error occurs', async () => {
    userModel.exec.mockRejectedValue(new Error('DB Error'));

    await expect(service.remove(userId)).rejects.toThrow(
      InternalServerErrorException,
    );
  });
});