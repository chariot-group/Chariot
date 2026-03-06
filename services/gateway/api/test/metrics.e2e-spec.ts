import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "@/app.module";

describe("Metrics (e2e)", () => {
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

  describe("/metrics (GET)", () => {
    it("should expose Prometheus metrics", () => {
      return request(app.getHttpServer())
        .get("/metrics")
        .expect(200)
        .expect("Content-Type", /text\/plain/)
        .expect((res) => {
          expect(res.text).toContain("http_requests_total");
          expect(res.text).toContain("http_request_duration_seconds");
          expect(res.text).toContain("nodejs_");
        });
    });

    it("should include custom metrics labels", async () => {
      // Make a request to generate metrics
      await request(app.getHttpServer()).get("/health");

      const metricsResponse = await request(app.getHttpServer()).get("/metrics").expect(200);

      expect(metricsResponse.text).toContain("method=");
      expect(metricsResponse.text).toContain("route=");
      expect(metricsResponse.text).toContain("status=");
    });
  });
});
