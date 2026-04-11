import { MetricsInterceptor } from '@/metrics/metrics.interceptor';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { Counter, Histogram } from 'prom-client';

describe('MetricsInterceptor', () => {
  let interceptor: MetricsInterceptor;
  let mockHttpRequestsCounter: jest.Mocked<Counter>;
  let mockHttpRequestDuration: jest.Mocked<Histogram>;
  let mockExecutionContext: jest.Mocked<ExecutionContext>;
  let mockCallHandler: jest.Mocked<CallHandler>;

  beforeEach(() => {
    // Mock des métriques Prometheus
    mockHttpRequestsCounter = {
      inc: jest.fn(),
    } as any;

    mockHttpRequestDuration = {
      observe: jest.fn(),
    } as any;

    interceptor = new MetricsInterceptor(
      mockHttpRequestsCounter,
      mockHttpRequestDuration,
    );

    // Mock ExecutionContext
    mockExecutionContext = {
      switchToHttp: jest.fn(),
    } as any;

    // Mock Response
    const mockResponse = {
      statusCode: 200,
    };

    // Mock Request
    const mockRequest = {
      method: 'GET',
      url: '/api/test',
      route: { path: '/api/test' },
    };

    mockExecutionContext.switchToHttp.mockReturnValue({
      getRequest: jest.fn().mockReturnValue(mockRequest),
      getResponse: jest.fn().mockReturnValue(mockResponse),
    } as any);

    // Mock CallHandler
    mockCallHandler = {
      handle: jest.fn(),
    } as any;
  });

  describe('intercept - success case', () => {
    it('should record metrics on successful request', (done) => {
      mockCallHandler.handle.mockReturnValue(of(null));
      const loggerSpy = jest
        .spyOn(interceptor['logger'], 'debug')
        .mockImplementation();

      interceptor
        .intercept(mockExecutionContext, mockCallHandler)
        .subscribe(() => {
          expect(mockHttpRequestsCounter.inc).toHaveBeenCalledWith({
            method: 'GET',
            route: '/api/test',
            status_code: '200',
          });

          expect(mockHttpRequestDuration.observe).toHaveBeenCalledWith(
            {
              method: 'GET',
              route: '/api/test',
            },
            expect.any(Number),
          );

          expect(loggerSpy).toHaveBeenCalledWith(
            expect.stringMatching(/GET \/api\/test 200 - \d+\.\d+s/),
          );

          loggerSpy.mockRestore();
          done();
        });
    });

    it('should calculate request duration correctly', (done) => {
      jest.useFakeTimers();
      mockCallHandler.handle.mockReturnValue(of(null));
      jest.spyOn(interceptor['logger'], 'debug').mockImplementation();

      interceptor
        .intercept(mockExecutionContext, mockCallHandler)
        .subscribe(() => {
          expect(mockHttpRequestDuration.observe).toHaveBeenCalledWith(
            expect.any(Object),
            expect.any(Number),
          );

          jest.useRealTimers();
          done();
        });
    });

    it('should handle request without route path', (done) => {
      const mockRequest = {
        method: 'POST',
        url: '/api/users',
        route: undefined,
      };

      mockExecutionContext.switchToHttp = jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
        getResponse: jest.fn().mockReturnValue({ statusCode: 201 }),
      } as any);

      jest.spyOn(interceptor['logger'], 'debug').mockImplementation();
      mockCallHandler.handle.mockReturnValue(of(null));

      interceptor
        .intercept(mockExecutionContext, mockCallHandler)
        .subscribe(() => {
          expect(mockHttpRequestsCounter.inc).toHaveBeenCalledWith({
            method: 'POST',
            route: '/api/users',
            status_code: '201',
          });

          done();
        });
    });

    it('should handle various HTTP methods', (done) => {
      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
      let completedTests = 0;

      methods.forEach((method) => {
        const mockRequest = {
          method,
          url: '/api/test',
          route: { path: '/api/test' },
        };

        mockExecutionContext.switchToHttp = jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
          getResponse: jest.fn().mockReturnValue({ statusCode: 200 }),
        } as any);

        jest.spyOn(interceptor['logger'], 'debug').mockImplementation();
        mockCallHandler.handle.mockReturnValue(of(null));

        interceptor
          .intercept(mockExecutionContext, mockCallHandler)
          .subscribe(() => {
            expect(mockHttpRequestsCounter.inc).toHaveBeenCalledWith(
              expect.objectContaining({ method }),
            );

            completedTests++;
            if (completedTests === methods.length) {
              done();
            }
          });
      });
    });

    it('should handle different status codes', (done) => {
      const statusCodes = [200, 201, 204, 301, 400, 403, 404, 500];
      let completedTests = 0;

      statusCodes.forEach((statusCode) => {
        mockExecutionContext.switchToHttp = jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            method: 'GET',
            url: '/api/test',
            route: { path: '/api/test' },
          }),
          getResponse: jest.fn().mockReturnValue({ statusCode }),
        } as any);

        jest.spyOn(interceptor['logger'], 'debug').mockImplementation();
        mockCallHandler.handle.mockReturnValue(of(null));

        interceptor
          .intercept(mockExecutionContext, mockCallHandler)
          .subscribe(() => {
            expect(mockHttpRequestsCounter.inc).toHaveBeenCalledWith(
              expect.objectContaining({
                status_code: statusCode.toString(),
              }),
            );

            completedTests++;
            if (completedTests === statusCodes.length) {
              done();
            }
          });
      });
    });
  });

  describe('intercept - error case', () => {
    it('should record metrics on error with status code', (done) => {
      const error = new Error('Test error');
      (error as any).status = 500;

      mockCallHandler.handle.mockReturnValue(throwError(() => error));

      const loggerSpy = jest
        .spyOn(interceptor['logger'], 'error')
        .mockImplementation();

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        error: () => {
          expect(mockHttpRequestsCounter.inc).toHaveBeenCalledWith({
            method: 'GET',
            route: '/api/test',
            status_code: '500',
          });

          expect(mockHttpRequestDuration.observe).toHaveBeenCalledWith(
            {
              method: 'GET',
              route: '/api/test',
            },
            expect.any(Number),
          );

          expect(loggerSpy).toHaveBeenCalledWith(
            expect.stringMatching(
              /GET \/api\/test 500 - \d+\.\d+s - Test error/,
            ),
          );

          loggerSpy.mockRestore();
          done();
        },
      });
    });

    it('should use default status code 500 when error has no status', (done) => {
      const error = new Error('Unknown error');

      mockCallHandler.handle.mockReturnValue(throwError(() => error));

      jest.spyOn(interceptor['logger'], 'error').mockImplementation();

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        error: () => {
          expect(mockHttpRequestsCounter.inc).toHaveBeenCalledWith(
            expect.objectContaining({
              status_code: '500',
            }),
          );

          done();
        },
      });
    });

    it('should handle various error status codes', (done) => {
      const statusCodes = [400, 401, 403, 404, 500, 502, 503];
      let completedTests = 0;

      statusCodes.forEach((statusCode) => {
        const error = new Error(`Error ${statusCode}`);
        (error as any).status = statusCode;

        mockCallHandler.handle.mockReturnValue(throwError(() => error));

        jest.spyOn(interceptor['logger'], 'error').mockImplementation();

        interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
          error: () => {
            expect(mockHttpRequestsCounter.inc).toHaveBeenCalledWith(
              expect.objectContaining({
                status_code: statusCode.toString(),
              }),
            );

            completedTests++;
            if (completedTests === statusCodes.length) {
              done();
            }
          },
        });
      });
    });

    it('should log error message', (done) => {
      const errorMessage = 'Database connection failed';
      const error = new Error(errorMessage);
      (error as any).status = 500;

      mockCallHandler.handle.mockReturnValue(throwError(() => error));

      const loggerSpy = jest
        .spyOn(interceptor['logger'], 'error')
        .mockImplementation();

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        error: () => {
          expect(loggerSpy).toHaveBeenCalledWith(
            expect.stringContaining(errorMessage),
          );

          loggerSpy.mockRestore();
          done();
        },
      });
    });
  });

  describe('intercept - route path handling', () => {
    it('should use route.path when available', (done) => {
      const mockRequest = {
        method: 'GET',
        url: '/api/users?id=123&name=test',
        route: { path: '/api/users/:id' },
      };

      mockExecutionContext.switchToHttp = jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
        getResponse: jest.fn().mockReturnValue({ statusCode: 200 }),
      } as any);

      jest.spyOn(interceptor['logger'], 'debug').mockImplementation();
      mockCallHandler.handle.mockReturnValue(of(null));

      interceptor
        .intercept(mockExecutionContext, mockCallHandler)
        .subscribe(() => {
          expect(mockHttpRequestsCounter.inc).toHaveBeenCalledWith({
            method: 'GET',
            route: '/api/users/:id',
            status_code: '200',
          });

          done();
        });
    });

    it('should fallback to url when route.path is not available', (done) => {
      const mockRequest = {
        method: 'GET',
        url: '/api/test',
        route: null,
      };

      mockExecutionContext.switchToHttp = jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
        getResponse: jest.fn().mockReturnValue({ statusCode: 200 }),
      } as any);

      jest.spyOn(interceptor['logger'], 'debug').mockImplementation();
      mockCallHandler.handle.mockReturnValue(of(null));

      interceptor
        .intercept(mockExecutionContext, mockCallHandler)
        .subscribe(() => {
          expect(mockHttpRequestsCounter.inc).toHaveBeenCalledWith({
            method: 'GET',
            route: '/api/test',
            status_code: '200',
          });

          done();
        });
    });
  });

  describe('intercept - tap behavior', () => {
    it('should call next.handle() to get the observable', (done) => {
      mockCallHandler.handle.mockReturnValue(of(null));
      jest.spyOn(interceptor['logger'], 'debug').mockImplementation();

      interceptor
        .intercept(mockExecutionContext, mockCallHandler)
        .subscribe(() => {
          expect(mockCallHandler.handle).toHaveBeenCalled();
          done();
        });
    });

    it('should pass through the response from next.handle()', (done) => {
      const expectedResponse = { data: 'test' };
      mockCallHandler.handle.mockReturnValue(of(expectedResponse));
      jest.spyOn(interceptor['logger'], 'debug').mockImplementation();

      interceptor
        .intercept(mockExecutionContext, mockCallHandler)
        .subscribe((response) => {
          expect(response).toEqual(expectedResponse);
          done();
        });
    });
  });

  describe('intercept - performance timing', () => {
    it('should measure request duration in seconds', (done) => {
      mockCallHandler.handle.mockReturnValue(of(null));

      jest.spyOn(interceptor['logger'], 'debug').mockImplementation();

      interceptor
        .intercept(mockExecutionContext, mockCallHandler)
        .subscribe(() => {
          const observeCall = mockHttpRequestDuration.observe.mock.calls[0];
          const duration = (observeCall as any)[1];

          expect(typeof duration).toBe('number');
          expect(duration).toBeGreaterThanOrEqual(0);
          expect(duration).toBeLessThan(10); // Should be very fast in test

          done();
        });
    });

    it('should format duration with millisecond precision in logs', (done) => {
      mockCallHandler.handle.mockReturnValue(of(null));
      const loggerSpy = jest
        .spyOn(interceptor['logger'], 'debug')
        .mockImplementation();

      interceptor
        .intercept(mockExecutionContext, mockCallHandler)
        .subscribe(() => {
          const logCall = loggerSpy.mock.calls[0][0];
          expect(logCall).toMatch(/\d+\.\d{3}s/);

          loggerSpy.mockRestore();
          done();
        });
    });
  });
});
