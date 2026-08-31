import { randomUUID } from "crypto";
import { INestApplication } from "@nestjs/common";
import request, { Response } from "supertest";
import { createTestApp, signAdminToken } from "./test-app";

describe("CskhLogs (e2e)", () => {
  let app: INestApplication;
  let authHeader: string;
  let orderId: string;
  let customerId: string;

  beforeAll(async () => {
    app = await createTestApp();
    authHeader = `Bearer ${signAdminToken(app)}`;

    const customerRes = await request(app.getHttpServer())
      .post("/api/v1/customers")
      .set("Authorization", authHeader)
      .send({ name: "KH e2e CSKH", phone: `09${randomUUID().slice(0, 8)}` })
      .expect(201);
    customerId = customerRes.body.id;

    const orderRes = await request(app.getHttpServer())
      .post("/api/v1/orders")
      .set("Authorization", authHeader)
      .send({ customerId, totalAmount: 500000 })
      .expect(201);
    orderId = orderRes.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it("POST /api/v1/cskh-logs -> 201, GET -> chứa dòng vừa tạo", async () => {
    const createRes = await request(app.getHttpServer())
      .post("/api/v1/cskh-logs")
      .set("Authorization", authHeader)
      .send({ orderId, customerId, status: "called", note: "Gọi xác nhận" })
      .expect(201);

    await request(app.getHttpServer())
      .get("/api/v1/cskh-logs")
      .set("Authorization", authHeader)
      .expect(200)
      .expect((res: Response) => {
        expect(res.body.some((l: { id: string }) => l.id === createRes.body.id)).toBe(true);
      });
  });

  it("POST orderId không tồn tại -> 404 (nguyên tắc #2)", () => {
    return request(app.getHttpServer())
      .post("/api/v1/cskh-logs")
      .set("Authorization", authHeader)
      .send({ orderId: randomUUID(), customerId, status: "called" })
      .expect(404);
  });

  it("GET /api/v1/cskh-logs không kèm token -> 401", () => {
    return request(app.getHttpServer()).get("/api/v1/cskh-logs").expect(401);
  });
});
