import { randomUUID } from "crypto";
import { INestApplication } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import request, { Response } from "supertest";
import { createTestApp, signAdminToken } from "./test-app";

describe("AuditLogs (e2e)", () => {
  let app: INestApplication;
  let adminAuthHeader: string;

  beforeAll(async () => {
    app = await createTestApp();
    adminAuthHeader = `Bearer ${signAdminToken(app)}`;
  });

  afterAll(async () => {
    await app.close();
  });

  it("PATCH /api/v1/orders/:id đổi status tự sinh AuditLog, admin xem được qua GET /api/v1/audit-logs", async () => {
    const orderRes = await request(app.getHttpServer())
      .post("/api/v1/orders")
      .set("Authorization", adminAuthHeader)
      .send({ customerId: randomUUID(), totalAmount: 200000 })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/api/v1/orders/${orderRes.body.id}`)
      .set("Authorization", adminAuthHeader)
      .send({ status: "confirmed" })
      .expect(200);

    await request(app.getHttpServer())
      .get("/api/v1/audit-logs")
      .set("Authorization", adminAuthHeader)
      .expect(200)
      .expect((res: Response) => {
        expect(
          res.body.some(
            (l: { tableName: string; recordId: string; newValue: string }) =>
              l.tableName === "Order" && l.recordId === orderRes.body.id && l.newValue === "confirmed"
          )
        ).toBe(true);
      });
  });

  it("GET /api/v1/audit-logs với tài khoản không có quyền -> 403 (chỉ admin xem)", async () => {
    const jwtService = app.get(JwtService);
    const nonAdminToken = jwtService.sign({ sub: randomUUID(), username: "non-admin-e2e", isAdmin: false });

    return request(app.getHttpServer())
      .get("/api/v1/audit-logs")
      .set("Authorization", `Bearer ${nonAdminToken}`)
      .expect(403);
  });

  it("GET /api/v1/audit-logs không kèm token -> 401", () => {
    return request(app.getHttpServer()).get("/api/v1/audit-logs").expect(401);
  });
});
