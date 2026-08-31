import { randomUUID } from "crypto";
import { INestApplication } from "@nestjs/common";
import request, { Response } from "supertest";
import { createTestApp, signAdminToken } from "./test-app";

describe("Products (e2e)", () => {
  let app: INestApplication;
  let authHeader: string;

  beforeAll(async () => {
    app = await createTestApp();
    authHeader = `Bearer ${signAdminToken(app)}`;
  });

  afterAll(async () => {
    await app.close();
  });

  function uniqueSku() {
    return `SKU-E2E-${randomUUID().slice(0, 8)}`;
  }

  it("POST /api/v1/products -> 201, GET -> chứa sản phẩm vừa tạo, PATCH sửa thành công", async () => {
    const sku = uniqueSku();

    const createRes = await request(app.getHttpServer())
      .post("/api/v1/products")
      .set("Authorization", authHeader)
      .send({ name: "Sàn gỗ Oak 12mm", sku, unit: "gói", price: 250000 })
      .expect(201);

    await request(app.getHttpServer())
      .get("/api/v1/products")
      .set("Authorization", authHeader)
      .expect(200)
      .expect((res: Response) => {
        expect(res.body.some((p: { sku: string }) => p.sku === sku)).toBe(true);
      });

    await request(app.getHttpServer())
      .patch(`/api/v1/products/${createRes.body.id}`)
      .set("Authorization", authHeader)
      .send({ price: 260000 })
      .expect(200)
      .expect((res: Response) => {
        expect(res.body.price).toBe(260000);
      });
  });

  it("POST /api/v1/products trùng sku -> 409", async () => {
    const sku = uniqueSku();
    await request(app.getHttpServer())
      .post("/api/v1/products")
      .set("Authorization", authHeader)
      .send({ name: "A", sku, unit: "gói", price: 100000 })
      .expect(201);

    return request(app.getHttpServer())
      .post("/api/v1/products")
      .set("Authorization", authHeader)
      .send({ name: "B", sku, unit: "gói", price: 200000 })
      .expect(409);
  });

  it("POST /api/v1/product-performance -> 201 khi productId hợp lệ, GET liệt kê đúng", async () => {
    const productRes = await request(app.getHttpServer())
      .post("/api/v1/products")
      .set("Authorization", authHeader)
      .send({ name: "Sàn gỗ Test", sku: uniqueSku(), unit: "gói", price: 300000 })
      .expect(201);

    const perfRes = await request(app.getHttpServer())
      .post("/api/v1/product-performance")
      .set("Authorization", authHeader)
      .send({ productId: productRes.body.id, stage: "GĐ1", evaluation: "win" })
      .expect(201);

    await request(app.getHttpServer())
      .get("/api/v1/product-performance")
      .set("Authorization", authHeader)
      .expect(200)
      .expect((res: Response) => {
        expect(res.body.some((p: { id: string }) => p.id === perfRes.body.id)).toBe(true);
      });
  });

  it("POST /api/v1/product-performance productId không tồn tại -> 404", () => {
    return request(app.getHttpServer())
      .post("/api/v1/product-performance")
      .set("Authorization", authHeader)
      .send({ productId: randomUUID(), stage: "GĐ1", evaluation: "pending" })
      .expect(404);
  });

  it("GET /api/v1/products không kèm token -> 401", () => {
    return request(app.getHttpServer()).get("/api/v1/products").expect(401);
  });
});
