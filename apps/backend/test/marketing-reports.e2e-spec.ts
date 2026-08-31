import { INestApplication } from "@nestjs/common";
import request, { Response } from "supertest";
import { createTestApp, signAdminToken } from "./test-app";

describe("MarketingReports (e2e)", () => {
  let app: INestApplication;
  let authHeader: string;

  beforeAll(async () => {
    app = await createTestApp();
    authHeader = `Bearer ${signAdminToken(app)}`;
  });

  afterAll(async () => {
    await app.close();
  });

  it("POST /api/v1/marketing-reports -> 201, GET -> chứa báo cáo vừa tạo", async () => {
    await request(app.getHttpServer())
      .post("/api/v1/marketing-reports")
      .set("Authorization", authHeader)
      .send({
        date: "2026-08-07",
        shift: "sáng",
        product: "SGO-OAK-12MM",
        market: "US",
        team: "Team C",
        adCost: 2000000,
        messageCount: 70,
        orderCount: 5,
        revenue: 12000000,
        revenueActual: 11000000
      })
      .expect(201);

    await request(app.getHttpServer())
      .get("/api/v1/marketing-reports")
      .set("Authorization", authHeader)
      .expect(200)
      .expect((res: Response) => {
        expect(res.body.some((r: { team: string }) => r.team === "Team C")).toBe(true);
      });
  });

  it("POST /api/v1/marketing-reports thiếu field bắt buộc -> 400", () => {
    return request(app.getHttpServer())
      .post("/api/v1/marketing-reports")
      .set("Authorization", authHeader)
      .send({ shift: "sáng" })
      .expect(400);
  });

  it("GET /api/v1/marketing-reports không kèm token -> 401", () => {
    return request(app.getHttpServer()).get("/api/v1/marketing-reports").expect(401);
  });
});
