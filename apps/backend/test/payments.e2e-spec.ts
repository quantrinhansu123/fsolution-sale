import { randomUUID } from "crypto";
import { INestApplication } from "@nestjs/common";
import request, { Response } from "supertest";
import { createTestApp, signAdminToken } from "./test-app";

describe("Payments (e2e)", () => {
  let app: INestApplication;
  let authHeader: string;

  beforeAll(async () => {
    app = await createTestApp();
    authHeader = `Bearer ${signAdminToken(app)}`;
  });

  afterAll(async () => {
    await app.close();
  });

  it("POST /api/v1/payments -> 201 status mặc định pending, GET -> chứa khoản thu vừa tạo", async () => {
    const orderId = randomUUID();

    const createRes = await request(app.getHttpServer())
      .post("/api/v1/payments")
      .set("Authorization", authHeader)
      .send({ orderId, amount: 500000 })
      .expect(201)
      .expect((res: Response) => {
        expect(res.body.status).toBe("pending");
      });

    await request(app.getHttpServer())
      .get("/api/v1/payments")
      .set("Authorization", authHeader)
      .expect(200)
      .expect((res: Response) => {
        expect(res.body.some((p: { id: string }) => p.id === createRes.body.id)).toBe(true);
      });
  });

  it("PATCH /api/v1/payments/:id set status=completed khi chưa đối soát -> 400", async () => {
    const createRes = await request(app.getHttpServer())
      .post("/api/v1/payments")
      .set("Authorization", authHeader)
      .send({ orderId: randomUUID(), amount: 500000 })
      .expect(201);

    return request(app.getHttpServer())
      .patch(`/api/v1/payments/${createRes.body.id}`)
      .set("Authorization", authHeader)
      .send({ status: "completed" })
      .expect(400);
  });

  it("PATCH /api/v1/payments/:id kèm reconciledAt -> set completed thành công", async () => {
    const createRes = await request(app.getHttpServer())
      .post("/api/v1/payments")
      .set("Authorization", authHeader)
      .send({ orderId: randomUUID(), amount: 500000 })
      .expect(201);

    return request(app.getHttpServer())
      .patch(`/api/v1/payments/${createRes.body.id}`)
      .set("Authorization", authHeader)
      .send({ status: "completed", reconciledAt: new Date().toISOString() })
      .expect(200)
      .expect((res: Response) => {
        expect(res.body.status).toBe("completed");
      });
  });

  it("PATCH /api/v1/payments/:id với id không tồn tại -> 404", () => {
    return request(app.getHttpServer())
      .patch(`/api/v1/payments/${randomUUID()}`)
      .set("Authorization", authHeader)
      .send({ status: "completed", reconciledAt: new Date().toISOString() })
      .expect(404);
  });

  it("GET /api/v1/payments không kèm token -> 401", () => {
    return request(app.getHttpServer()).get("/api/v1/payments").expect(401);
  });
});
