import { Test, TestingModule } from "@nestjs/testing";
import { HealthService } from "@/health/health.service";
import { HttpService } from "@nestjs/axios";
import { of, throwError } from "rxjs";
import { AxiosResponse } from "axios";

describe("HealthService", () => {
  let service: HealthService;
  let httpService: HttpService;

  beforeEach(async () => {
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
    it("should return ready when adventure service is available", async () => {
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
    });

    it("should return not_ready when adventure service is unavailable", async () => {
      const error = new Error("Service unavailable");
      jest.spyOn(httpService, "get").mockReturnValue(throwError(() => error));

      const readiness = await service.getReadiness();

      expect(readiness.status).toBe("not_ready");
      expect(readiness.checks.gateway).toBe(true);
      expect(readiness.checks.adventure).toBe(false);
    });
  });
});
