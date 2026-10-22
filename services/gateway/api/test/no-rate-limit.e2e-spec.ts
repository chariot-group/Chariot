import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, HttpStatus } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "@/app.module";

/**
 * Rate limiting is enforced upstream by Cloudflare: the gateway must never throttle.
 */
describe("No application rate limit (e2e)", () => {
  let app: INestApplication;

  beforeEach(async () => {
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

  it("should not return 429 on a burst of requests", async () => {
    for (let i = 0; i < 150; i++) {
      const res = await request(app.getHttpServer()).get("/");
      expect(res.status).not.toBe(HttpStatus.TOO_MANY_REQUESTS);
    }
  });

  it("should ignore legacy GATEWAY_RATE_LIMIT_* variables", async () => {
    await app.close();
    process.env.GATEWAY_RATE_LIMIT_MAX = "1";
    process.env.GATEWAY_RATE_LIMIT_WINDOW = "60000";
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();

    for (let i = 0; i < 5; i++) {
      const res = await request(app.getHttpServer()).get("/api/unknown-service/resource");
      expect(res.status).not.toBe(HttpStatus.TOO_MANY_REQUESTS);
    }
  });

  it("should not expose the removed rate limit metric", async () => {
    const res = await request(app.getHttpServer()).get("/metrics").expect(200);
    expect(res.text).not.toContain("gateway_rate_limit_exceeded_total");
  });
});
