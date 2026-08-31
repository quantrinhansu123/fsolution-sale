import { randomUUID } from "crypto";
import { INestApplication } from "@nestjs/common";
import request, { Response } from "supertest";
import { createTestApp, signAdminToken } from "./test-app";

describe("Employees (e2e)", () => {
  let app: INestApplication;
  let authHeader: string;

  beforeAll(async () => {
    app = await createTestApp();
    authHeader = `Bearer ${signAdminToken(app)}`;
  });

  afterAll(async () => {
    await app.close();
  });

  function uniqueEmail() {
    return `e2e-${randomUUID().slice(0, 8)}@fsolution.test`;
  }

  it("POST /api/v1/employees -> 201, GET -> chứa nhân sự vừa tạo, PATCH sửa thành công", async () => {
    const email = uniqueEmail();

    const createRes = await request(app.getHttpServer())
      .post("/api/v1/employees")
      .set("Authorization", authHeader)
      .send({ name: "Nguyễn Văn A", email, role: "Sale" })
      .expect(201);

    await request(app.getHttpServer())
      .get("/api/v1/employees")
      .set("Authorization", authHeader)
      .expect(200)
      .expect((res: Response) => {
        expect(res.body.some((e: { id: string }) => e.id === createRes.body.id)).toBe(true);
      });

    await request(app.getHttpServer())
      .patch(`/api/v1/employees/${createRes.body.id}`)
      .set("Authorization", authHeader)
      .send({ status: "inactive" })
      .expect(200)
      .expect((res: Response) => {
        expect(res.body.status).toBe("inactive");
      });
  });

  it("POST /api/v1/employees trùng email -> 409", async () => {
    const email = uniqueEmail();
    await request(app.getHttpServer())
      .post("/api/v1/employees")
      .set("Authorization", authHeader)
      .send({ name: "A", email, role: "MKT" })
      .expect(201);

    return request(app.getHttpServer())
      .post("/api/v1/employees")
      .set("Authorization", authHeader)
      .send({ name: "B", email, role: "CS" })
      .expect(409);
  });

  it("GET /api/v1/employees không kèm token -> 401", () => {
    return request(app.getHttpServer()).get("/api/v1/employees").expect(401);
  });
});
