import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "@/app.module";

describe("HealthController (e2e)", () => {
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
  });

  describe("/health (GET)", () => {
    it("should return health status", () => {
      return request(app.getHttpServer())
        .get("/health")
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty("status", "ok");
          expect(res.body).toHaveProperty("timestamp");
          expect(res.body).toHaveProperty("service", "chariot-gateway");
          expect(res.body).toHaveProperty("version");
        });
    });
  });

  describe("/ready (GET)", () => {
    it("should return readiness status", () => {
      return request(app.getHttpServer())
        .get("/ready")
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty("status");
          expect(res.body).toHaveProperty("timestamp");
          expect(res.body).toHaveProperty("checks");
          expect(res.body.checks).toHaveProperty("gateway", true);
          expect(res.body.checks).toHaveProperty("adventure");
        });
    });
  });
});
