import { randomUUID } from "crypto";
import { INestApplication } from "@nestjs/common";
import request, { Response } from "supertest";
import { createTestApp, signAdminToken } from "./test-app";

describe("KPIs (e2e)", () => {
  let app: INestApplication;
  let authHeader: string;
  let employeeId: string;

  beforeAll(async () => {
    app = await createTestApp();
    authHeader = `Bearer ${signAdminToken(app)}`;

    const employeeRes = await request(app.getHttpServer())
      .post("/api/v1/employees")
      .set("Authorization", authHeader)
      .send({ name: "Nhân sự Test KPI", email: `e2e-kpi-${randomUUID().slice(0, 8)}@fsolution.test`, role: "Sale" })
      .expect(201);
    employeeId = employeeRes.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it("POST /api/v1/kpis -> 201, GET -> chứa dòng vừa tạo", async () => {
    const createRes = await request(app.getHttpServer())
      .post("/api/v1/kpis")
      .set("Authorization", authHeader)
      .send({ employeeId, period: "2026-08", score: 9 })
      .expect(201);

    await request(app.getHttpServer())
      .get("/api/v1/kpis")
      .set("Authorization", authHeader)
      .expect(200)
      .expect((res: Response) => {
        expect(res.body.some((k: { id: string }) => k.id === createRes.body.id)).toBe(true);
      });
  });

  it("POST /api/v1/kpis employeeId không tồn tại -> 404", () => {
    return request(app.getHttpServer())
      .post("/api/v1/kpis")
      .set("Authorization", authHeader)
      .send({ employeeId: randomUUID(), period: "2026-08", score: 5 })
      .expect(404);
  });

  it("GET /api/v1/kpis không kèm token -> 401", () => {
    return request(app.getHttpServer()).get("/api/v1/kpis").expect(401);
  });
});
