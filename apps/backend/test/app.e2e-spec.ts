import { INestApplication } from "@nestjs/common";
import request, { Response } from "supertest";
import { createTestApp } from "./test-app";

describe("Health (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /api/v1/health -> 200 { status: ok }", () => {
    return request(app.getHttpServer())
      .get("/api/v1/health")
      .expect(200)
      .expect((res: Response) => {
        expect(res.body.status).toBe("ok");
      });
  });
});
