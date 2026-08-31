import { randomUUID } from "crypto";
import { INestApplication } from "@nestjs/common";
import request, { Response } from "supertest";
import { createTestApp, signAdminToken } from "./test-app";

describe("Customers (e2e)", () => {
  let app: INestApplication;
  let authHeader: string;

  beforeAll(async () => {
    app = await createTestApp();
    authHeader = `Bearer ${signAdminToken(app)}`;
  });

  afterAll(async () => {
    await app.close();
  });

  function uniquePhone() {
    return `09${randomUUID().replace(/-/g, "").slice(0, 8)}`;
  }

  it("POST /api/v1/customers -> 201, GET -> chứa khách hàng vừa tạo, PATCH sửa thành công", async () => {
    const phone = uniquePhone();

    const createRes = await request(app.getHttpServer())
      .post("/api/v1/customers")
      .set("Authorization", authHeader)
      .send({ name: "Nguyễn Văn A", phone })
      .expect(201)
      .expect((res: Response) => {
        expect(res.body.customerType).toBe("new");
      });

    await request(app.getHttpServer())
      .get("/api/v1/customers")
      .set("Authorization", authHeader)
      .expect(200)
      .expect((res: Response) => {
        expect(res.body.some((c: { phone: string }) => c.phone === phone)).toBe(true);
      });

    await request(app.getHttpServer())
      .patch(`/api/v1/customers/${createRes.body.id}`)
      .set("Authorization", authHeader)
      .send({ customerType: "old" })
      .expect(200)
      .expect((res: Response) => {
        expect(res.body.customerType).toBe("old");
      });
  });

  it("POST /api/v1/customers trùng phone -> 409", async () => {
    const phone = uniquePhone();
    await request(app.getHttpServer())
      .post("/api/v1/customers")
      .set("Authorization", authHeader)
      .send({ name: "A", phone })
      .expect(201);

    return request(app.getHttpServer())
      .post("/api/v1/customers")
      .set("Authorization", authHeader)
      .send({ name: "B", phone })
      .expect(409);
  });

  it("GET /api/v1/customers không kèm token -> 401", () => {
    return request(app.getHttpServer()).get("/api/v1/customers").expect(401);
  });
});
