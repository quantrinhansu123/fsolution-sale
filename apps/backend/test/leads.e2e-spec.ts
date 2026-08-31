import { randomUUID } from "crypto";
import { INestApplication } from "@nestjs/common";
import request, { Response } from "supertest";
import { createTestApp, signAdminToken } from "./test-app";

describe("Leads (e2e)", () => {
  let app: INestApplication;
  let authHeader: string;

  beforeAll(async () => {
    app = await createTestApp();
    authHeader = `Bearer ${signAdminToken(app)}`;
  });

  afterAll(async () => {
    await app.close();
  });

  it("POST /api/v1/leads -> 201, GET /api/v1/leads -> chứa lead vừa tạo", async () => {
    const phone = `09${randomUUID().replace(/-/g, "").slice(0, 8)}`;

    await request(app.getHttpServer())
      .post("/api/v1/leads")
      .set("Authorization", authHeader)
      .send({ name: "Lê Văn C", phone, source: "Zalo OA" })
      .expect(201)
      .expect((res: Response) => {
        expect(res.body.status).toBe("new");
        expect(res.body.id).toBeDefined();
      });

    await request(app.getHttpServer())
      .get("/api/v1/leads")
      .set("Authorization", authHeader)
      .expect(200)
      .expect((res: Response) => {
        expect(res.body.some((l: { phone: string }) => l.phone === phone)).toBe(true);
      });
  });

  it("POST /api/v1/leads thiếu phone -> 400", () => {
    return request(app.getHttpServer())
      .post("/api/v1/leads")
      .set("Authorization", authHeader)
      .send({ name: "Thiếu SĐT", source: "Facebook Ads" })
      .expect(400);
  });

  it("GET /api/v1/leads không kèm token -> 401", () => {
    return request(app.getHttpServer()).get("/api/v1/leads").expect(401);
  });

  it("PATCH /api/v1/leads/{id} đổi status -> 200, GET .../logs phản ánh đúng lịch sử", async () => {
    const phone = `09${randomUUID().replace(/-/g, "").slice(0, 8)}`;
    const createRes = await request(app.getHttpServer())
      .post("/api/v1/leads")
      .set("Authorization", authHeader)
      .send({ name: "Đỗ Thị E", phone, source: "Website Form" })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/api/v1/leads/${createRes.body.id}`)
      .set("Authorization", authHeader)
      .send({ status: "contacted", note: "Đã gọi tư vấn lần 1" })
      .expect(200)
      .expect((res: Response) => {
        expect(res.body.status).toBe("contacted");
      });

    await request(app.getHttpServer())
      .get(`/api/v1/leads/${createRes.body.id}/logs`)
      .set("Authorization", authHeader)
      .expect(200)
      .expect((res: Response) => {
        expect(res.body).toHaveLength(1);
        expect(res.body[0].toStatus).toBe("contacted");
      });
  });
});
