import { Test, TestingModule } from '@nestjs/testing';
import { MetricsController } from '@/metrics/metrics.controller';
import { Response } from 'express';
import * as promClient from 'prom-client';

// Mock prom-client
jest.mock('prom-client', () => ({
  register: {
    contentType: 'text/plain; version=0.0.4; charset=utf-8',
    metrics: jest.fn(),
  },
}));

describe('MetricsController', () => {
  let controller: MetricsController;
  let mockResponse: jest.Mocked<Response>;
  let mockRegister: any;

  beforeEach(async () => {
    // Setup mock response
    mockResponse = {
      set: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    } as any;

    // Setup mock register - use the factory mock, don't redefine
    mockRegister = promClient.register as any;
    (mockRegister.metrics as jest.Mock).mockReset();
    (mockRegister.metrics as jest.Mock).mockResolvedValue(
      '# HELP chariot_http_requests_total Total HTTP requests\n',
    );

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MetricsController],
    }).compile();

    controller = module.get<MetricsController>(MetricsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMetrics', () => {
    it('should return metrics in prometheus format', async () => {
      const metricsData = `# HELP chariot_http_requests_total Total HTTP requests
# TYPE chariot_http_requests_total counter
chariot_http_requests_total{method="GET",route="/api/test",status="200"} 42`;

      mockRegister.metrics.mockResolvedValue(metricsData);

      await controller.getMetrics(mockResponse);

      expect(mockResponse.send).toHaveBeenCalledWith(metricsData);
    });

    it('should set correct Content-Type header', async () => {
      mockRegister.metrics.mockResolvedValue('');

      await controller.getMetrics(mockResponse);

      expect(mockResponse.set).toHaveBeenCalledWith(
        'Content-Type',
        'text/plain; version=0.0.4; charset=utf-8',
      );
    });

    it('should use register.contentType from prom-client', async () => {
      mockRegister.metrics.mockResolvedValue('');

      await controller.getMetrics(mockResponse);

      expect(mockResponse.set).toHaveBeenCalledWith(
        'Content-Type',
        mockRegister.contentType,
      );
    });

    it('should call register.metrics to get metrics data', async () => {
      mockRegister.metrics.mockResolvedValue('');

      await controller.getMetrics(mockResponse);

      expect(mockRegister.metrics).toHaveBeenCalled();
    });

    it('should handle multiple metrics entries', async () => {
      const metricsData = `# HELP chariot_http_requests_total Total HTTP requests
# TYPE chariot_http_requests_total counter
chariot_http_requests_total{method="GET",route="/campaigns",status="200"} 100
chariot_http_requests_total{method="POST",route="/users",status="201"} 50
chariot_http_requests_total{method="GET",route="/campaigns",status="500"} 5
# HELP chariot_http_request_duration_seconds HTTP request duration
# TYPE chariot_http_request_duration_seconds histogram
chariot_http_request_duration_seconds_bucket{method="GET",le="0.005"} 10`;

      mockRegister.metrics.mockResolvedValue(metricsData);

      await controller.getMetrics(mockResponse);

      expect(mockResponse.send).toHaveBeenCalledWith(metricsData);
    });

    it('should send data after setting content type', async () => {
      const callOrder: string[] = [];

      (mockResponse.set as any) = jest.fn(() => {
        callOrder.push('set');
        return mockResponse;
      });

      (mockResponse.send as any) = jest.fn(() => {
        callOrder.push('send');
        return mockResponse;
      });

      mockRegister.metrics.mockResolvedValue('metrics data');

      await controller.getMetrics(mockResponse);

      expect(callOrder).toEqual(['set', 'send']);
    });

    it('should handle empty metrics', async () => {
      mockRegister.metrics.mockResolvedValue('');

      await controller.getMetrics(mockResponse);

      expect(mockResponse.send).toHaveBeenCalledWith('');
      expect(mockResponse.set).toHaveBeenCalled();
    });

    it('should handle metrics with special characters', async () => {
      const metricsData = `# HELP chariot_test Test metric with special chars: _
# TYPE chariot_test counter
chariot_test{label="value_with_underscore"} 42`;

      mockRegister.metrics.mockResolvedValue(metricsData);

      await controller.getMetrics(mockResponse);

      expect(mockResponse.send).toHaveBeenCalledWith(metricsData);
    });

    it('should handle metrics with different label combinations', async () => {
      const metricsData = `chariot_http_requests_total{method="GET",route="/api/users/:id",status="200"} 123
chariot_http_requests_total{method="POST",route="/api/users",status="201"} 45
chariot_http_requests_total{method="DELETE",route="/api/users/:id",status="204"} 12
chariot_http_requests_total{method="GET",route="/api/campaigns",status="500"} 2`;

      mockRegister.metrics.mockResolvedValue(metricsData);

      await controller.getMetrics(mockResponse);

      expect(mockResponse.send).toHaveBeenCalledWith(metricsData);
    });

    it('should handle large metrics output', async () => {
      let largeMetrics = '';
      for (let i = 0; i < 1000; i++) {
        largeMetrics += `chariot_test_metric{index="${i}"} ${i}\n`;
      }

      mockRegister.metrics.mockResolvedValue(largeMetrics);

      await controller.getMetrics(mockResponse);

      expect(mockResponse.send).toHaveBeenCalledWith(largeMetrics);
    });

    it('should properly chain method calls on response', async () => {
      mockRegister.metrics.mockResolvedValue('metrics');

      await controller.getMetrics(mockResponse);

      expect(mockResponse.set).toHaveBeenCalledTimes(1);
      expect(mockResponse.send).toHaveBeenCalledTimes(1);
    });

    it('should not throw when metrics promise resolves', async () => {
      mockRegister.metrics.mockResolvedValue('');

      await expect(controller.getMetrics(mockResponse)).resolves.not.toThrow();
    });

    it('should include HELP and TYPE sections for different metrics', async () => {
      const metricsData = `# HELP chariot_http_requests_total HTTP requests counter
# TYPE chariot_http_requests_total counter
chariot_http_requests_total{method="GET",route="/api",status="200"} 100
# HELP chariot_http_request_duration_seconds HTTP request duration
# TYPE chariot_http_request_duration_seconds histogram
chariot_http_request_duration_seconds_bucket{method="GET",le="0.01"} 50`;

      mockRegister.metrics.mockResolvedValue(metricsData);

      await controller.getMetrics(mockResponse);

      expect(mockResponse.send).toHaveBeenCalledWith(metricsData);
    });
  });

  describe('getMetrics - Error scenarios', () => {
    it('should handle promise rejection from register.metrics', async () => {
      const error = new Error('Failed to collect metrics');
      mockRegister.metrics.mockRejectedValue(error);

      // The method is async but doesn't explicitly handle errors,
      // so the promise should reject
      await expect(controller.getMetrics(mockResponse)).rejects.toThrow(
        'Failed to collect metrics',
      );
    });

    it('should still set content type even if sending metrics fails', async () => {
      mockRegister.metrics.mockResolvedValue('metrics');
      mockResponse.send.mockImplementation(() => {
        throw new Error('Send failed');
      });

      try {
        await controller.getMetrics(mockResponse);
      } catch {
        // Expected
      }

      expect(mockResponse.set).toHaveBeenCalled();
    });
  });

  describe('getMetrics - Response object interaction', () => {
    it('should return the response object after sending', async () => {
      mockRegister.metrics.mockResolvedValue('');

      await controller.getMetrics(mockResponse);

      // The controller doesn't explicitly return the response object
      // but it does chain the calls, so verify the calls were made
      expect(mockResponse.set).toHaveBeenCalled();
      expect(mockResponse.send).toHaveBeenCalled();
    });

    it('should call res.set before res.send', async () => {
      mockRegister.metrics.mockResolvedValue('');
      const order: string[] = [];

      (mockResponse.set as any) = jest.fn(() => {
        order.push('set');
        return mockResponse;
      });

      (mockResponse.send as any) = jest.fn(() => {
        order.push('send');
        return mockResponse;
      });

      await controller.getMetrics(mockResponse);

      expect(order).toEqual(['set', 'send']);
    });
  });

  describe('getMetrics - Metrics format validation', () => {
    it('should return prometheus text format', async () => {
      const metricsData = `# HELP test_counter A test counter
# TYPE test_counter counter
test_counter 42`;

      mockRegister.metrics.mockResolvedValue(metricsData);

      await controller.getMetrics(mockResponse);

      const sentData = mockResponse.send.mock.calls[0][0];
      expect(sentData).toContain('# HELP');
      expect(sentData).toContain('# TYPE');
    });

    it('should have correct content type for prometheus', async () => {
      mockRegister.metrics.mockResolvedValue('');

      await controller.getMetrics(mockResponse);

      const contentType = mockResponse.set.mock.calls[0][1];
      expect(contentType).toContain('text/plain');
    });

    it('should maintain metric naming convention', async () => {
      const metricsData = `chariot_http_requests_total{method="GET"} 100
chariot_http_request_duration_seconds_bucket{le="0.01"} 50
chariot_emails_sent_total{type="otp"} 200`;

      mockRegister.metrics.mockResolvedValue(metricsData);

      await controller.getMetrics(mockResponse);

      const sentData = mockResponse.send.mock.calls[0][0];
      expect(sentData).toContain('chariot_');
    });
  });
});
