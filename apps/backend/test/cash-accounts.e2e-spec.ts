import { randomUUID } from "crypto";
import { INestApplication } from "@nestjs/common";
import request, { Response } from "supertest";
import { createTestApp, signAdminToken } from "./test-app";

describe("CashAccounts (e2e)", () => {
  let app: INestApplication;
  let authHeader: string;

  beforeAll(async () => {
    app = await createTestApp();
    authHeader = `Bearer ${signAdminToken(app)}`;
  });

  afterAll(async () => {
    await app.close();
  });

  function uniqueCode() {
    return `CA-E2E-${randomUUID().slice(0, 8)}`;
  }

  it("POST /api/v1/cash-accounts -> 201, GET -> chứa mã tài khoản vừa tạo", async () => {
    const code = uniqueCode();

    const createRes = await request(app.getHttpServer())
      .post("/api/v1/cash-accounts")
      .set("Authorization", authHeader)
      .send({ code, name: "Quỹ tiền mặt VN", type: "income" })
      .expect(201);

    await request(app.getHttpServer())
      .get("/api/v1/cash-accounts")
      .set("Authorization", authHeader)
      .expect(200)
      .expect((res: Response) => {
        expect(res.body.some((a: { id: string }) => a.id === createRes.body.id)).toBe(true);
      });
  });

  it("POST /api/v1/cash-accounts trùng code -> 409", async () => {
    const code = uniqueCode();
    await request(app.getHttpServer())
      .post("/api/v1/cash-accounts")
      .set("Authorization", authHeader)
      .send({ code, name: "A", type: "income" })
      .expect(201);

    return request(app.getHttpServer())
      .post("/api/v1/cash-accounts")
      .set("Authorization", authHeader)
      .send({ code, name: "B", type: "expense" })
      .expect(409);
  });

  it("GET /api/v1/cash-accounts không kèm token -> 401", () => {
    return request(app.getHttpServer()).get("/api/v1/cash-accounts").expect(401);
  });
});
