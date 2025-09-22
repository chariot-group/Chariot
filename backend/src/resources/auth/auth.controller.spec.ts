import { AuthController } from '@/resources/auth/auth.controller';
import { NotFoundException, GoneException, UnauthorizedException } from '@nestjs/common';
import { Types } from 'mongoose';

describe('AuthController - login', () => {
  let controller: AuthController;
  let authService: { signIn: jest.Mock };

  beforeEach(() => {
    authService = { signIn: jest.fn() };
    controller = new AuthController(authService as any, {} as any, {} as any, {} as any);
  });

  it('should call authService.signIn and return the result', async () => {
    const dto = { email: 'user@example.com', password: 'secure' };
    const mockResponse = { access_token: 'jwt.token' };

    authService.signIn.mockResolvedValue(mockResponse);

    const result = await controller.login(dto);

    expect(authService.signIn).toHaveBeenCalledWith(dto);
    expect(result).toBe(mockResponse);
  });

  it('should throw UnauthorizedException if credentials are invalid', async () => {
    const dto = { email: 'wrong@example.com', password: 'badpass' };
    authService.signIn.mockRejectedValue(new UnauthorizedException('Invalid credentials'));

    await expect(controller.login(dto)).rejects.toThrow(UnauthorizedException);
  });

  it('should propagate unexpected errors from authService', async () => {
    const dto = { email: 'user@example.com', password: 'error' };
    authService.signIn.mockRejectedValue(new Error('DB error'));

    await expect(controller.login(dto)).rejects.toThrow(Error);
  });
});

describe('AuthController - create', () => {
  let controller: AuthController;
  let userService: { create: jest.Mock };
  let userController: { validateCampaignRelations: jest.Mock };

  beforeEach(() => {
    userService = { create: jest.fn() };
    userController = { validateCampaignRelations: jest.fn() };
    controller = new AuthController({} as any, userService as any, userController as any, {} as any);
  });

  it('should validate campaigns and create user with campaigns', async () => {
    const dto = {
      username: 'hugo',
      email: 'hugo@example.com',
      password: 'secure',
      campaigns: ['64a8a8888c9f5f77a0e8f9a1'],
    };
    const mockUser = { _id: 'userId' };

    userService.create.mockResolvedValue(mockUser);

    const result = await controller.create(dto);

    expect(userController.validateCampaignRelations).toHaveBeenCalledWith(dto.campaigns);
    expect(userService.create).toHaveBeenCalledWith(dto);
    expect(result).toBe(mockUser);
  });

  it('should default to empty campaigns if none provided', async () => {
    const dto = {
      username: 'no-camp',
      email: 'nocamp@example.com',
      password: 'secure',
    };
    const mockUser = { _id: 'userId' };

    userService.create.mockResolvedValue(mockUser);

    const result = await controller.create(dto);

    expect(userController.validateCampaignRelations).toHaveBeenCalledWith([]);
    expect(userService.create).toHaveBeenCalledWith(dto);
    expect(result).toBe(mockUser);
  });

  it('should throw if campaign validation fails', async () => {
    const dto = {
      username: 'fail',
      email: 'fail@example.com',
      password: 'fail',
      campaigns: ['invalid-id'],
    };

    userController.validateCampaignRelations.mockRejectedValue(new Error('invalid campaign'));

    await expect(controller.create(dto)).rejects.toThrow('invalid campaign');
  });

  it('should throw if user creation fails', async () => {
    const dto = {
      username: 'fail-create',
      email: 'fail@create.com',
      password: 'fail',
      campaigns: ['64a8a8888c9f5f77a0e8f9a1'],
    };

    userService.create.mockRejectedValue(new Error('creation failed'));

    await expect(controller.create(dto)).rejects.toThrow('creation failed');
  });
});

describe('AuthController - forgotPassword', () => {
  let controller: AuthController;
  let authService: { forgotPassword: jest.Mock };
  let userModel: { findById: jest.Mock };

  beforeEach(() => {
    authService = { forgotPassword: jest.fn() };
    userModel = { findById: jest.fn() };

    controller = new AuthController(
      authService as any,
      {} as any,
      {} as any,
      userModel as any,
    );
  });

  const userId = new Types.ObjectId();
  const dto = {
    otp: '123456',
    newPassword: 'newPass123',
    confirmPassword: 'newPass123',
  };

  it('should call authService.forgotPassword if user exists and is not deleted', async () => {
    userModel.findById.mockResolvedValue({ _id: userId, deletedAt: null });
    authService.forgotPassword.mockResolvedValue({ message: 'done' });

    const result = await controller.forgotPassword(userId, dto);

    expect(userModel.findById).toHaveBeenCalledWith(userId);
    expect(authService.forgotPassword).toHaveBeenCalledWith(userId, dto);
    expect(result).toEqual({ message: 'done' });
  });

  it('should throw NotFoundException if user does not exist', async () => {
    userModel.findById.mockResolvedValue(null);

    await expect(controller.forgotPassword(userId, dto)).rejects.toThrow(NotFoundException);
  });

  it('should throw GoneException if user is soft deleted', async () => {
    userModel.findById.mockResolvedValue({ _id: userId, deletedAt: new Date() });

    await expect(controller.forgotPassword(userId, dto)).rejects.toThrow(GoneException);
  });

  it('should propagate error from authService.forgotPassword', async () => {
    userModel.findById.mockResolvedValue({ _id: userId, deletedAt: null });
    authService.forgotPassword.mockRejectedValue(new Error('DB error'));

    await expect(controller.forgotPassword(userId, dto)).rejects.toThrow('DB error');
  });
});

describe('AuthController - verifyOTP', () => {
  let controller: AuthController;
  let authService: { verifyOTP: jest.Mock };
  let userModel: { findById: jest.Mock };

  beforeEach(() => {
    authService = { verifyOTP: jest.fn() };
    userModel = { findById: jest.fn() };
    controller = new AuthController(authService as any, {} as any, {} as any, userModel as any);
  });

  it('should verify OTP if user exists and is active', async () => {
    const id = new Types.ObjectId();
    const dto = { otp: '123456' };
    const mockUser = { _id: id, deletedAt: null };

    userModel.findById.mockResolvedValue(mockUser);
    authService.verifyOTP.mockResolvedValue({ message: 'OK' });

    const result = await controller.verifyOTP(id, dto);

    expect(userModel.findById).toHaveBeenCalledWith(id);
    expect(authService.verifyOTP).toHaveBeenCalledWith(id, dto);
    expect(result).toEqual({ message: 'OK' });
  });

  it('should throw NotFoundException if user not found', async () => {
    const id = new Types.ObjectId();
    userModel.findById.mockResolvedValue(null);

    await expect(controller.verifyOTP(id, { otp: '123456' })).rejects.toThrow(NotFoundException);
  });

  it('should throw GoneException if user is deleted', async () => {
    const id = new Types.ObjectId();
    userModel.findById.mockResolvedValue({ _id: id, deletedAt: new Date() });

    await expect(controller.verifyOTP(id, { otp: '123456' })).rejects.toThrow(GoneException);
  });

  it('should propagate error from authService.verifyOTP', async () => {
    const id = new Types.ObjectId();
    userModel.findById.mockResolvedValue({ _id: id, deletedAt: null });
    authService.verifyOTP.mockRejectedValue(new Error('Internal error'));

    await expect(controller.verifyOTP(id, { otp: '123456' })).rejects.toThrow('Internal error');
  });
});

describe('AuthController - resetPassword', () => {
  let controller: AuthController;
  let authService: { resetPassword: jest.Mock };
  let userModel: { findOne: jest.Mock };

  beforeEach(() => {
    authService = { resetPassword: jest.fn() };
    userModel = { findOne: jest.fn() };
    controller = new AuthController(authService as any, {} as any, {} as any, userModel as any);
  });

  it('should reset password if user exists and is active', async () => {
    const dto = { email: 'user@example.com', locale: 'fr' };
    const mockUser = { email: dto.email, deletedAt: null };

    userModel.findOne.mockResolvedValue(mockUser);
    authService.resetPassword.mockResolvedValue({ success: true });

    const result = await controller.resetPassword(dto);

    expect(userModel.findOne).toHaveBeenCalledWith({ email: dto.email });
    expect(authService.resetPassword).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ success: true });
  });

  it('should throw NotFoundException if user not found', async () => {
    const dto = { email: 'missing@example.com', locale: 'fr' };
    userModel.findOne.mockResolvedValue(null);

    await expect(controller.resetPassword(dto)).rejects.toThrow(NotFoundException);
  });

  it('should throw GoneException if user is deleted', async () => {
    const dto = { email: 'deleted@example.com', locale: 'fr' };
    userModel.findOne.mockResolvedValue({ deletedAt: new Date() });

    await expect(controller.resetPassword(dto)).rejects.toThrow(GoneException);
  });

  it('should propagate error from authService.resetPassword', async () => {
    const dto = { email: 'user@example.com', locale: 'fr' };
    userModel.findOne.mockResolvedValue({ deletedAt: null });
    authService.resetPassword.mockRejectedValue(new Error('Service error'));

    await expect(controller.resetPassword(dto)).rejects.toThrow('Service error');
  });
});