import { randomUUID } from "crypto";
import { INestApplication } from "@nestjs/common";
import request, { Response } from "supertest";
import { createTestApp, signAdminToken } from "./test-app";

describe("SystemConfigs (e2e)", () => {
  let app: INestApplication;
  let authHeader: string;

  beforeAll(async () => {
    app = await createTestApp();
    authHeader = `Bearer ${signAdminToken(app)}`;
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /api/v1/system-configs -> 200, chứa sẵn cấu hình mặc định (seed lúc khởi động)", () => {
    return request(app.getHttpServer())
      .get("/api/v1/system-configs")
      .set("Authorization", authHeader)
      .expect(200)
      .expect((res: Response) => {
        expect(res.body.some((c: { key: string }) => c.key === "exchange_rate_usd")).toBe(true);
      });
  });

  it("PATCH /api/v1/system-configs/:key -> 200, sửa value thành công", () => {
    return request(app.getHttpServer())
      .patch("/api/v1/system-configs/low_stock_threshold")
      .set("Authorization", authHeader)
      .send({ value: "20" })
      .expect(200)
      .expect((res: Response) => {
        expect(res.body.value).toBe("20");
      });
  });

  it("PATCH /api/v1/system-configs/:key với key không tồn tại -> 404", () => {
    return request(app.getHttpServer())
      .patch(`/api/v1/system-configs/unknown-${randomUUID()}`)
      .set("Authorization", authHeader)
      .send({ value: "1" })
      .expect(404);
  });

  it("GET /api/v1/system-configs không kèm token -> 401", () => {
    return request(app.getHttpServer()).get("/api/v1/system-configs").expect(401);
  });
});
