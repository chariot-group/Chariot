import { Test, TestingModule } from "@nestjs/testing";
import { HealthService } from "@/health/health.service";
import { HttpService } from "@nestjs/axios";
import { of, throwError } from "rxjs";
import { AxiosResponse } from "axios";

describe("HealthService", () => {
  let service: HealthService;
  let httpService: HttpService;

  beforeEach(async () => {
    process.env.ADVENTURE_SERVICE_URL = "http://test-adventure:9000";
    process.env.SESSION_SERVICE_URL = "http://test-session:9002";

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: HttpService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
    httpService = module.get<HttpService>(HttpService);
  });

  afterEach(() => {
    delete process.env.ADVENTURE_SERVICE_URL;
    delete process.env.SESSION_SERVICE_URL;
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getHealth", () => {
    it("should return gateway health status", async () => {
      const health = await service.getHealth();

      expect(health).toHaveProperty("status", "ok");
      expect(health).toHaveProperty("timestamp");
      expect(health).toHaveProperty("service", "chariot-gateway");
      expect(health).toHaveProperty("version", "1.0.0");
    });
  });

  describe("getReadiness", () => {
    it("should return ready when all services are available", async () => {
      const mockResponse: AxiosResponse = {
        data: {},
        status: 200,
        statusText: "OK",
        headers: {},
        config: {} as any,
      };

      jest.spyOn(httpService, "get").mockReturnValue(of(mockResponse));

      const readiness = await service.getReadiness();

      expect(readiness.status).toBe("ready");
      expect(readiness.checks.gateway).toBe(true);
      expect(readiness.checks.adventure).toBe(true);
      expect(readiness.checks.session).toBe(true);
    });

    it("should return not_ready when a service is unavailable", async () => {
      const error = new Error("Service unavailable");
      jest.spyOn(httpService, "get").mockReturnValue(throwError(() => error));

      const readiness = await service.getReadiness();

      expect(readiness.status).toBe("not_ready");
      expect(readiness.checks.gateway).toBe(true);
      expect(readiness.checks.adventure).toBe(false);
      expect(readiness.checks.session).toBe(false);
    });
  });
});
