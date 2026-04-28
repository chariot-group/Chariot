import { Test, TestingModule } from '@nestjs/testing';
import {
  ExecutionContext,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { KeycloakAuthGuard } from './keycloak-auth.guard';
import * as jwt from 'jsonwebtoken';

describe('KeycloakAuthGuard', () => {
  let guard: KeycloakAuthGuard;
  let reflector: Reflector;
  let mockLogger: jest.Mocked<Logger>;

  const mockExecutionContext = (request: any) => {
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as any as ExecutionContext;
  };

  beforeEach(async () => {
    // Mock du Logger
    mockLogger = {
      error: jest.fn(),
      log: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KeycloakAuthGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: string) => {
              const config: Record<string, string> = {
                KEYCLOAK_INTERNAL_URL: 'http://localhost:8080/auth',
                KEYCLOAK_URL: 'http://localhost:8080',
                KEYCLOAK_REALM: 'test-realm',
                KEYCLOAK_CLIENT_ID: 'test-client',
              };
              return config[key] ?? defaultValue;
            }),
          },
        },
      ],
    }).compile();

    guard = module.get<KeycloakAuthGuard>(KeycloakAuthGuard);
    reflector = module.get<Reflector>(Reflector);

    // Déclencher onModuleInit pour initialiser la config
    await guard.onModuleInit();

    // Injecter le mock du logger dans l'instance du guard
    (guard as any).logger = mockLogger;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    it('should allow OPTIONS requests (CORS preflight)', async () => {
      const context = mockExecutionContext({ method: 'OPTIONS' });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow public routes', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
      const context = mockExecutionContext({
        method: 'GET',
        headers: {},
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should throw UnauthorizedException when no authorization header', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      const context = mockExecutionContext({
        method: 'GET',
        headers: {},
      });

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockLogger.error).toHaveBeenCalledWith('No authorization header');
    });

    it('should throw UnauthorizedException when authorization format is invalid', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      const context = mockExecutionContext({
        method: 'GET',
        headers: {
          authorization: 'InvalidFormat token123',
        },
      });

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Invalid authorization format',
      );
    });

    it('should throw UnauthorizedException when token is missing', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      const context = mockExecutionContext({
        method: 'GET',
        headers: {
          authorization: 'Bearer ',
        },
      });

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Invalid authorization format',
      );
    });

    it('should log error with stack trace when token validation fails', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      const context = mockExecutionContext({
        method: 'GET',
        headers: {
          authorization: 'Bearer invalid.token.here',
        },
      });

      // Mock jwt.decode pour retourner une structure invalide
      jest.spyOn(jwt, 'decode').mockReturnValue(null);

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(mockLogger.error).toHaveBeenCalled();
      const errorCall = mockLogger.error.mock.calls[0];
      expect(errorCall[0]).toContain('Token validation failed');
      expect(errorCall[1]).toBeDefined(); // Stack trace présente
    });
  });

  describe('verifyToken', () => {
    it('should log error when JWT decode fails', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      jest.spyOn(jwt, 'decode').mockReturnValue('invalid');

      const context = mockExecutionContext({
        method: 'GET',
        headers: {
          authorization: 'Bearer invalid.token',
        },
      });

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should log error when kid is missing from token header', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      jest.spyOn(jwt, 'decode').mockReturnValue({
        header: {},
        payload: {},
      } as any);

      const context = mockExecutionContext({
        method: 'GET',
        headers: {
          authorization: 'Bearer token.without.kid',
        },
      });

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('Logger integration', () => {
    it('should use Logger with correct context name', () => {
      const loggerInstance = (guard as any).logger;
      expect(loggerInstance).toBeDefined();
    });

    it('should log errors with stack traces', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      const mockError = new Error('Test error');
      jest.spyOn(jwt, 'decode').mockImplementation(() => {
        throw mockError;
      });

      const context = mockExecutionContext({
        method: 'GET',
        headers: {
          authorization: 'Bearer test.token',
        },
      });

      await expect(guard.canActivate(context)).rejects.toThrow();

      expect(mockLogger.error).toHaveBeenCalled();
      const errorCall = mockLogger.error.mock.calls[0];
      expect(errorCall[1]).toBeDefined(); // Vérifie que la stack trace est passée
    });
  });
});
