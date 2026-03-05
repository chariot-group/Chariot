import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, HttpStatus } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "@/app.module";

describe("Rate Limiting (e2e)", () => {
  let app: INestApplication;

  beforeEach(async () => {
    // Set test rate limit configuration
    process.env.GATEWAY_RATE_LIMIT_MAX = "5";
    process.env.GATEWAY_RATE_LIMIT_WINDOW = "10000"; // 10 seconds

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    delete process.env.GATEWAY_RATE_LIMIT_MAX;
    delete process.env.GATEWAY_RATE_LIMIT_WINDOW;
  });

  it("should allow requests within rate limit", async () => {
    for (let i = 0; i < 5; i++) {
      await request(app.getHttpServer()).get("/").expect(200);
    }
  });

  it("should block requests exceeding rate limit", async () => {
    // Make requests up to the limit
    for (let i = 0; i < 5; i++) {
      await request(app.getHttpServer()).get("/");
    }

    // Next request should be blocked
    await request(app.getHttpServer()).get("/").expect(HttpStatus.TOO_MANY_REQUESTS);
  });

  it("should not apply rate limiting to health endpoints", async () => {
    // Make many requests to health endpoint
    for (let i = 0; i < 10; i++) {
      await request(app.getHttpServer()).get("/health").expect(200);
    }
  });

  it("should not apply rate limiting to ready endpoint", async () => {
    for (let i = 0; i < 10; i++) {
      await request(app.getHttpServer()).get("/ready").expect(200);
    }
  });

  it("should not apply rate limiting to metrics endpoint", async () => {
    for (let i = 0; i < 10; i++) {
      await request(app.getHttpServer()).get("/metrics").expect(200);
    }
  });
});
