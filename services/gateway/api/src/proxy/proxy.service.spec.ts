import { Test, TestingModule } from "@nestjs/testing";
import { ProxyService } from "./proxy.service";
import { HttpService } from "@nestjs/axios";
import { of, throwError } from "rxjs";
import { AxiosResponse } from "axios";
import { BadRequestException } from "@nestjs/common";

describe("ProxyService", () => {
  let service: ProxyService;
  let httpService: HttpService;

  beforeEach(async () => {
    // Set up environment for tests
    process.env.ADVENTURE_SERVICE_URL = "http://test-adventure:9000";
    process.env.USERS_SERVICE_URL = "http://test-users:9001";

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

  afterEach(() => {
    delete process.env.USERS_SERVICE_URL;
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("forward", () => {
    it("should forward GET request to adventure service successfully", async () => {
      const mockResponse: AxiosResponse = {
        data: { result: "success" },
        status: 200,
        statusText: "OK",
        headers: {},
        config: { headers: {} } as AxiosResponse["config"],
      };

      jest.spyOn(httpService, "request").mockReturnValue(of(mockResponse));

      const result = await service.forward("adventure", "GET", "/test", null, { "user-agent": "test" });

      expect(result.status).toBe(200);
      expect(result.data).toEqual({ result: "success" });
      expect(httpService.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "http://test-adventure:9000/test",
          method: "get",
        }),
      );
    });

    it("should forward POST request with body to users service", async () => {
      const mockResponse: AxiosResponse = {
        data: { id: "123" },
        status: 201,
        statusText: "Created",
        headers: {},
        config: { headers: {} } as AxiosResponse["config"],
      };

      const body = { name: "test" };

      jest.spyOn(httpService, "request").mockReturnValue(of(mockResponse));

      const result = await service.forward("users", "POST", "/users", body, { "content-type": "application/json" });

      expect(result.status).toBe(201);
      expect(result.data).toEqual({ id: "123" });
      expect(httpService.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "http://test-users:9001/users",
          method: "post",
          data: body,
        }),
      );
    });

    it("should throw BadRequestException for unconfigured service", async () => {
      await expect(service.forward("unknown", "GET", "/test", null, {})).rejects.toThrow(BadRequestException);

      await expect(service.forward("unknown", "GET", "/test", null, {})).rejects.toThrow(
        "Service 'unknown' is not available",
      );
    });

    it("should remove internal headers", async () => {
      const mockResponse: AxiosResponse = {
        data: {},
        status: 200,
        statusText: "OK",
        headers: {},
        config: { headers: {} } as AxiosResponse["config"],
      };

      const requestSpy = jest.spyOn(httpService, "request").mockReturnValue(of(mockResponse));

      await service.forward("adventure", "GET", "/test", null, {
        host: "localhost:8082",
        connection: "keep-alive",
        "content-length": "123",
        "user-agent": "test",
      });

      const callArgs = requestSpy.mock.calls[0][0];
      expect(callArgs.headers).not.toHaveProperty("host");
      expect(callArgs.headers).not.toHaveProperty("connection");
      expect(callArgs.headers).not.toHaveProperty("content-length");
      expect(callArgs.headers).toHaveProperty("user-agent", "test");
    });

    it("should handle errors from backend", async () => {
      const error = new Error("Connection refused");
      jest.spyOn(httpService, "request").mockReturnValue(throwError(() => error));

      await expect(service.forward("adventure", "GET", "/test", null, {})).rejects.toThrow("Connection refused");
    });
  });

  describe("forwardToAdventure (legacy)", () => {
    it("should call forward with adventure service", async () => {
      const mockResponse: AxiosResponse = {
        data: { result: "success" },
        status: 200,
        statusText: "OK",
        headers: {},
        config: { headers: {} } as AxiosResponse["config"],
      };

      jest.spyOn(httpService, "request").mockReturnValue(of(mockResponse));

      const result = await service.forwardToAdventure("GET", "/test", null, {});

      expect(result.status).toBe(200);
      expect(httpService.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "http://test-adventure:9000/test",
        }),
      );
    });
  });

  describe("getAvailableServices", () => {
    it("should return list of configured services", () => {
      const services = service.getAvailableServices();

      expect(services).toContain("adventure");
      expect(services).toContain("users");
      expect(services.length).toBeGreaterThanOrEqual(2);
    });
  });
});
