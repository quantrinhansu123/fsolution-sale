import { randomUUID } from "crypto";
import { INestApplication } from "@nestjs/common";
import request, { Response } from "supertest";
import { createTestApp, signAdminToken } from "./test-app";

describe("Campaigns (e2e)", () => {
  let app: INestApplication;
  let authHeader: string;

  beforeAll(async () => {
    app = await createTestApp();
    authHeader = `Bearer ${signAdminToken(app)}`;
  });

  afterAll(async () => {
    await app.close();
  });

  it("POST /api/v1/campaigns -> 201, GET -> chứa chiến dịch vừa tạo, PATCH sửa status", async () => {
    const name = `Chiến dịch ${randomUUID().slice(0, 8)}`;

    const createRes = await request(app.getHttpServer())
      .post("/api/v1/campaigns")
      .set("Authorization", authHeader)
      .send({ name, budget: 30000000 })
      .expect(201)
      .expect((res: Response) => {
        expect(res.body.status).toBe("active");
      });

    await request(app.getHttpServer())
      .get("/api/v1/campaigns")
      .set("Authorization", authHeader)
      .expect(200)
      .expect((res: Response) => {
        expect(res.body.some((c: { name: string }) => c.name === name)).toBe(true);
      });

    await request(app.getHttpServer())
      .patch(`/api/v1/campaigns/${createRes.body.id}`)
      .set("Authorization", authHeader)
      .send({ status: "completed" })
      .expect(200)
      .expect((res: Response) => {
        expect(res.body.status).toBe("completed");
      });
  });

  it("PATCH /api/v1/campaigns/:id với id không tồn tại -> 404", () => {
    return request(app.getHttpServer())
      .patch(`/api/v1/campaigns/${randomUUID()}`)
      .set("Authorization", authHeader)
      .send({ status: "completed" })
      .expect(404);
  });

  it("PATCH /api/v1/campaigns/:id với status không hợp lệ -> 400", async () => {
    const createRes = await request(app.getHttpServer())
      .post("/api/v1/campaigns")
      .set("Authorization", authHeader)
      .send({ name: `Chiến dịch ${randomUUID().slice(0, 8)}`, budget: 1000000 })
      .expect(201);

    return request(app.getHttpServer())
      .patch(`/api/v1/campaigns/${createRes.body.id}`)
      .set("Authorization", authHeader)
      .send({ status: "not-a-real-status" })
      .expect(400);
  });

  it("GET /api/v1/campaigns không kèm token -> 401", () => {
    return request(app.getHttpServer()).get("/api/v1/campaigns").expect(401);
  });
});
