import { randomUUID } from "crypto";
import { INestApplication } from "@nestjs/common";
import request, { Response } from "supertest";
import { createTestApp, signAdminToken } from "./test-app";

describe("Orders (e2e)", () => {
  let app: INestApplication;
  let authHeader: string;

  beforeAll(async () => {
    app = await createTestApp();
    authHeader = `Bearer ${signAdminToken(app)}`;
  });

  afterAll(async () => {
    await app.close();
  });

  it("POST /api/v1/orders -> 201, GET /api/v1/orders -> chứa order vừa tạo", async () => {
    const customerId = randomUUID();

    await request(app.getHttpServer())
      .post("/api/v1/orders")
      .set("Authorization", authHeader)
      .send({ customerId, totalAmount: 890000 })
      .expect(201)
      .expect((res: Response) => {
        expect(res.body.status).toBe("pending");
        expect(res.body.totalAmount).toBe(890000);
      });

    await request(app.getHttpServer())
      .get("/api/v1/orders")
      .set("Authorization", authHeader)
      .expect(200)
      .expect((res: Response) => {
        expect(res.body.some((o: { customerId: string }) => o.customerId === customerId)).toBe(
          true
        );
      });
  });

  it("POST /api/v1/orders với totalAmount <= 0 -> 400", () => {
    return request(app.getHttpServer())
      .post("/api/v1/orders")
      .set("Authorization", authHeader)
      .send({ customerId: randomUUID(), totalAmount: 0 })
      .expect(400);
  });

  it("GET /api/v1/orders không kèm token -> 401", () => {
    return request(app.getHttpServer()).get("/api/v1/orders").expect(401);
  });

  it("POST .../items thêm sản phẩm, GET .../items liệt kê đúng; PATCH khoá sau delivered", async () => {
    const createRes = await request(app.getHttpServer())
      .post("/api/v1/orders")
      .set("Authorization", authHeader)
      .send({ customerId: randomUUID(), totalAmount: 500000 })
      .expect(201);
    const orderId = createRes.body.id;

    await request(app.getHttpServer())
      .post(`/api/v1/orders/${orderId}/items`)
      .set("Authorization", authHeader)
      .send({ productId: randomUUID(), productName: "Sàn gỗ Oak 12mm", quantity: 2, unitPrice: 250000 })
      .expect(201);

    await request(app.getHttpServer())
      .get(`/api/v1/orders/${orderId}/items`)
      .set("Authorization", authHeader)
      .expect(200)
      .expect((res: Response) => {
        expect(res.body).toHaveLength(1);
        expect(res.body[0].productName).toBe("Sàn gỗ Oak 12mm");
      });

    await request(app.getHttpServer())
      .patch(`/api/v1/orders/${orderId}`)
      .set("Authorization", authHeader)
      .send({ status: "delivered" })
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/api/v1/orders/${orderId}`)
      .set("Authorization", authHeader)
      .send({ status: "confirmed" })
      .expect(409);
  });
});
