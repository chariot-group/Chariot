import { Test, TestingModule } from '@nestjs/testing';
import { ProxyService } from '@/proxy/proxy.service';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';

describe('ProxyService', () => {
  let service: ProxyService;
  let httpService: HttpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProxyService,
        {
          provide: HttpService,
          useValue: {
            request: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ProxyService>(ProxyService);
    httpService = module.get<HttpService>(HttpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('forwardToAdventure', () => {
    it('should forward GET request successfully', async () => {
      const mockResponse: AxiosResponse = {
        data: { result: 'success' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      jest.spyOn(httpService, 'request').mockReturnValue(of(mockResponse));

      const result = await service.forwardToAdventure(
        'GET',
        '/test',
        null,
        { 'user-agent': 'test' },
      );

      expect(result.status).toBe(200);
      expect(result.data).toEqual({ result: 'success' });
    });

    it('should forward POST request with body', async () => {
      const mockResponse: AxiosResponse = {
        data: { id: '123' },
        status: 201,
        statusText: 'Created',
        headers: {},
        config: {} as any,
      };

      const body = { name: 'test' };

      jest.spyOn(httpService, 'request').mockReturnValue(of(mockResponse));

      const result = await service.forwardToAdventure(
        'POST',
        '/users',
        body,
        { 'content-type': 'application/json' },
      );

      expect(result.status).toBe(201);
      expect(result.data).toEqual({ id: '123' });
    });

    it('should remove internal headers', async () => {
      const mockResponse: AxiosResponse = {
        data: {},
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      const requestSpy = jest.spyOn(httpService, 'request').mockReturnValue(of(mockResponse));

      await service.forwardToAdventure(
        'GET',
        '/test',
        null,
        {
          'host': 'localhost:8082',
          'connection': 'keep-alive',
          'content-length': '123',
          'user-agent': 'test',
        },
      );

      const callArgs = requestSpy.mock.calls[0][0];
      expect(callArgs.headers).not.toHaveProperty('host');
      expect(callArgs.headers).not.toHaveProperty('connection');
      expect(callArgs.headers).not.toHaveProperty('content-length');
      expect(callArgs.headers).toHaveProperty('user-agent', 'test');
    });

    it('should handle errors from backend', async () => {
      const error = new Error('Connection refused');
      jest.spyOn(httpService, 'request').mockReturnValue(throwError(() => error));

      await expect(
        service.forwardToAdventure('GET', '/test', null, {}),
      ).rejects.toThrow('Connection refused');
    });
  });
});
