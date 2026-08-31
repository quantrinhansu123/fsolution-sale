import { randomUUID } from "crypto";
import { INestApplication } from "@nestjs/common";
import request, { Response } from "supertest";
import { createTestApp, signAdminToken } from "./test-app";

describe("CashTransactions (e2e)", () => {
  let app: INestApplication;
  let authHeader: string;
  let cashAccountId: string;

  beforeAll(async () => {
    app = await createTestApp();
    authHeader = `Bearer ${signAdminToken(app)}`;

    const cashAccountRes = await request(app.getHttpServer())
      .post("/api/v1/cash-accounts")
      .set("Authorization", authHeader)
      .send({ code: `CA-CTX-${randomUUID().slice(0, 8)}`, name: "Quỹ Test CashTx", type: "income" })
      .expect(201);
    cashAccountId = cashAccountRes.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it("POST /api/v1/cash-transactions -> 201, GET -> chứa dòng vừa tạo", async () => {
    const createRes = await request(app.getHttpServer())
      .post("/api/v1/cash-transactions")
      .set("Authorization", authHeader)
      .send({
        cashAccountId,
        type: "income",
        content: "Thu tiền hợp đồng ORD-001",
        amount: 1000000,
        transactionDate: "2026-08-24",
      })
      .expect(201);

    await request(app.getHttpServer())
      .get("/api/v1/cash-transactions")
      .set("Authorization", authHeader)
      .expect(200)
      .expect((res: Response) => {
        expect(res.body.some((t: { id: string }) => t.id === createRes.body.id)).toBe(true);
      });
  });

  it("POST /api/v1/cash-transactions cashAccountId không tồn tại -> 404", () => {
    return request(app.getHttpServer())
      .post("/api/v1/cash-transactions")
      .set("Authorization", authHeader)
      .send({
        cashAccountId: randomUUID(),
        type: "expense",
        content: "Chi phí ads",
        amount: 500000,
        transactionDate: "2026-08-24",
      })
      .expect(404);
  });

  it("GET /api/v1/cash-transactions không kèm token -> 401", () => {
    return request(app.getHttpServer()).get("/api/v1/cash-transactions").expect(401);
  });
});
