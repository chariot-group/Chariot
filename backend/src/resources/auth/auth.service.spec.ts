import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '@/resources/auth/auth.service';
import { UserService } from '@/resources/user/user.service';
import { JwtService } from '@nestjs/jwt';
import { MaillingService } from '@/mailling/mailling.service';
import * as bcrypt from 'bcrypt';
import { UnauthorizedException, InternalServerErrorException, NotFoundException, BadRequestException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { User } from '@/resources/user/schemas/user.schema';
import { Types } from 'mongoose';

describe('AuthService - signIn', () => {
  let authService: AuthService;
  let userService: Partial<Record<keyof UserService, jest.Mock>>;
  let jwtService: Partial<Record<keyof JwtService, jest.Mock>>;
  let maillingService: Partial<Record<keyof MaillingService, jest.Mock>>;

  beforeEach(async () => {
    userService = {
      findByEmail: jest.fn(),
    };

    jwtService = {
      sign: jest.fn(),
    };

    maillingService = {};

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: userService },
        { provide: JwtService, useValue: jwtService },
        { provide: MaillingService, useValue: maillingService },
        {
          provide: getModelToken(User.name),
          useValue: {
            findById: jest.fn(),
            updateOne: jest.fn().mockReturnThis(),
            exec: jest.fn(),
          },
        }
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  it('should return a token when user is found and password is correct', async () => {
    const signInDto = { email: 'test@example.com', password: 'password123' };
    const user = { _id: 'userId', password: 'hashedPassword' };

    userService.findByEmail!.mockResolvedValue(user);
    (jest.spyOn(bcrypt, 'compare') as jest.Mock).mockResolvedValue(true);
    jwtService.sign!.mockReturnValue('jwt-token');

    const result = await authService.signIn(signInDto);

    expect(userService.findByEmail).toHaveBeenCalledWith(signInDto.email);
    expect(bcrypt.compare).toHaveBeenCalledWith(signInDto.password, user.password);
    expect(jwtService.sign).toHaveBeenCalledWith({
      iss: process.env.BACKEND_URL,
      sub: user._id,
      aud: process.env.FRONTEND_URL,
    });
    expect(result).toEqual({
      message: expect.stringContaining(`User ${signInDto.email} logged in`),
      access_token: 'jwt-token',
    });
  });

  it('should throw UnauthorizedException when user is not found', async () => {
    const signInDto = { email: 'notfound@example.com', password: 'password123' };
    userService.findByEmail!.mockResolvedValue(null);

    await expect(authService.signIn(signInDto)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException when password is incorrect', async () => {
    const signInDto = { email: 'test@example.com', password: 'wrongpassword' };
    const user = { _id: 'userId', password: 'hashedPassword' };

    userService.findByEmail!.mockResolvedValue(user);
    (jest.spyOn(bcrypt, 'compare') as jest.Mock).mockResolvedValue(false);

    await expect(authService.signIn(signInDto)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw InternalServerErrorException on unexpected error', async () => {
    const signInDto = { email: 'test@example.com', password: 'password123' };

    userService.findByEmail!.mockRejectedValue(new Error('Unexpected failure'));

    await expect(authService.signIn(signInDto)).rejects.toThrow(InternalServerErrorException);
  });
});

describe('AuthService - resetPassword', () => {
  let authService: AuthService;
  let userService: any;
  let maillingService: any;
  let userModel: any;

  beforeEach(async () => {
    userService = {
      findByEmail: jest.fn(),
    };

    maillingService = {
      sendOTP: jest.fn(),
    };

    userModel = {
      updateOne: jest.fn().mockReturnThis(),
      exec: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: userService },
        { provide: JwtService, useValue: {} },
        { provide: MaillingService, useValue: maillingService },
        {
          provide: getModelToken(User.name),
          useValue: userModel,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  const dto = {
    email: 'user@example.com',
    locale: 'fr',
  };

  it('should generate and send OTP if user is found and updated', async () => {
    const mockUser = { email: dto.email, username: 'UserName' };

    userService.findByEmail.mockResolvedValue(mockUser);
    userModel.exec.mockResolvedValue({ modifiedCount: 1 });

    const result = await authService.resetPassword(dto);

    expect(userService.findByEmail).toHaveBeenCalledWith(dto.email);
    expect(userModel.updateOne).toHaveBeenCalledWith({ email: dto.email }, expect.objectContaining({ otp: expect.any(Number) }));
    expect(maillingService.sendOTP).toHaveBeenCalledWith('UserName', dto.email, expect.any(Number), dto.locale);
    expect(result).toHaveProperty('message');
    expect(result).toHaveProperty('data', mockUser);
  });

  it('should throw NotFoundException if user is not updated', async () => {
    const mockUser = { email: dto.email, username: 'UserName' };

    userService.findByEmail.mockResolvedValue(mockUser);
    userModel.exec.mockResolvedValue({ modifiedCount: 0 });

    await expect(authService.resetPassword(dto)).rejects.toThrow(NotFoundException);
  });

  it('should throw InternalServerErrorException on unexpected error', async () => {
    userService.findByEmail.mockRejectedValue(new Error('Unexpected'));

    await expect(authService.resetPassword(dto)).rejects.toThrow(InternalServerErrorException);
  });
});

describe('AuthService - forgotPassword', () => {
  let authService: AuthService;
  let userModel: any;

  beforeEach(async () => {
    userModel = {
      updateOne: jest.fn().mockReturnThis(),
      exec: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: {} },
        { provide: JwtService, useValue: {} },
        { provide: MaillingService, useValue: {} },
        {
          provide: getModelToken(User.name),
          useValue: userModel,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  const userId = new Types.ObjectId();
  const dto = {
    otp: '123456',
    newPassword: 'newPassword123',
    confirmPassword: 'newPassword123',
  };

  it('should throw BadRequestException if passwords do not match', async () => {
    await expect(
      authService.forgotPassword(userId, {
        ...dto,
        confirmPassword: 'differentPassword',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should update password and return result if successful', async () => {
    (jest.spyOn(bcrypt, 'hash') as jest.Mock).mockResolvedValue('hashedPassword');
    userModel.exec.mockResolvedValue({ modifiedCount: 1 });

    const result = await authService.forgotPassword(userId, dto);

    expect(bcrypt.hash).toHaveBeenCalledWith(dto.confirmPassword, 10);
    expect(userModel.updateOne).toHaveBeenCalledWith(
      { _id: userId },
      expect.objectContaining({
        password: 'hashedPassword',
        otp: null,
      }),
    );
    expect(result).toHaveProperty('message');
    expect(result).toHaveProperty('data');
  });

  it('should throw InternalServerErrorException on failure', async () => {
    (jest.spyOn(bcrypt, 'hash') as jest.Mock).mockRejectedValue(new Error('fail'));

    await expect(authService.forgotPassword(userId, dto)).rejects.toThrow(
      InternalServerErrorException,
    );
  });
});

describe('AuthService - verifyOTP', () => {
  let authService: AuthService;
  let userModel: any;

  beforeEach(async () => {
    userModel = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: {} },
        { provide: JwtService, useValue: {} },
        { provide: MaillingService, useValue: {} },
        {
          provide: getModelToken(User.name),
          useValue: userModel,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  const userId = new Types.ObjectId();

  it('should verify OTP successfully', async () => {
    const dto = { otp: '123456' };
    userModel.findById.mockResolvedValue({ otp: '123456' });

    const result = await authService.verifyOTP(userId, dto);

    expect(userModel.findById).toHaveBeenCalledWith(userId);
    expect(result).toEqual({
      message: `OTP of #${userId} verified`,
    });
  });

  it('should throw UnauthorizedException if otp is incorrect', async () => {
    const dto = { otp: 'wrong' };
    userModel.findById.mockResolvedValue({ otp: '123456' });

    await expect(authService.verifyOTP(userId, dto)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException if user.otp is null', async () => {
    const dto = { otp: 'any' };
    userModel.findById.mockResolvedValue({ otp: null });

    await expect(authService.verifyOTP(userId, dto)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw InternalServerErrorException on unexpected error', async () => {
    userModel.findById.mockRejectedValue(new Error('DB error'));
    const dto = { otp: '123456' };

    await expect(authService.verifyOTP(userId, dto)).rejects.toThrow(InternalServerErrorException);
  });
});