import { randomUUID } from "crypto";
import { INestApplication } from "@nestjs/common";
import request, { Response } from "supertest";
import { createTestApp, signAdminToken } from "./test-app";

describe("Feedbacks (e2e)", () => {
  let app: INestApplication;
  let authHeader: string;

  beforeAll(async () => {
    app = await createTestApp();
    authHeader = `Bearer ${signAdminToken(app)}`;
  });

  afterAll(async () => {
    await app.close();
  });

  it("POST /api/v1/feedbacks -> 201, GET -> chứa dòng vừa tạo", async () => {
    const createRes = await request(app.getHttpServer())
      .post("/api/v1/feedbacks")
      .set("Authorization", authHeader)
      .send({ customerId: randomUUID(), source: "CSKH", content: "Hài lòng", rating: 5 })
      .expect(201);

    await request(app.getHttpServer())
      .get("/api/v1/feedbacks")
      .set("Authorization", authHeader)
      .expect(200)
      .expect((res: Response) => {
        expect(res.body.some((f: { id: string }) => f.id === createRes.body.id)).toBe(true);
      });
  });

  it("POST /api/v1/feedbacks rating ngoài khoảng 1-5 -> 400", () => {
    return request(app.getHttpServer())
      .post("/api/v1/feedbacks")
      .set("Authorization", authHeader)
      .send({ customerId: randomUUID(), source: "Sale", content: "Test", rating: 6 })
      .expect(400);
  });

  it("GET /api/v1/feedbacks không kèm token -> 401", () => {
    return request(app.getHttpServer()).get("/api/v1/feedbacks").expect(401);
  });
});
