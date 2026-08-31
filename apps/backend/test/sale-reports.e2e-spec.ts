import { randomUUID } from "crypto";
import { INestApplication } from "@nestjs/common";
import request, { Response } from "supertest";
import { createTestApp, signAdminToken } from "./test-app";

describe("SaleReports (e2e)", () => {
  let app: INestApplication;
  let authHeader: string;

  beforeAll(async () => {
    app = await createTestApp();
    authHeader = `Bearer ${signAdminToken(app)}`;
  });

  afterAll(async () => {
    await app.close();
  });

  it("POST /api/v1/sale-reports -> 201, GET -> chứa báo cáo vừa tạo", async () => {
    const employeeId = randomUUID();

    await request(app.getHttpServer())
      .post("/api/v1/sale-reports")
      .set("Authorization", authHeader)
      .send({
        employeeId,
        date: "2026-08-10",
        shift: "sáng",
        product: "SGO-OAK-12MM",
        market: "US",
        messageCount: 20,
        orderCount: 2,
        revenueActual: 5000000,
      })
      .expect(201);

    await request(app.getHttpServer())
      .get("/api/v1/sale-reports")
      .set("Authorization", authHeader)
      .expect(200)
      .expect((res: Response) => {
        expect(res.body.some((r: { employeeId: string }) => r.employeeId === employeeId)).toBe(true);
      });
  });

  it("POST /api/v1/sale-reports thiếu field bắt buộc -> 400", () => {
    return request(app.getHttpServer())
      .post("/api/v1/sale-reports")
      .set("Authorization", authHeader)
      .send({ employeeId: randomUUID() })
      .expect(400);
  });

  it("GET /api/v1/sale-reports không kèm token -> 401", () => {
    return request(app.getHttpServer()).get("/api/v1/sale-reports").expect(401);
  });
});
