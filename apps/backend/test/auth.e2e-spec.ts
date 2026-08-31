import { randomUUID } from "crypto";
import { INestApplication } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import request from "supertest";
import { createTestApp, signAdminToken } from "./test-app";

describe("Auth & Accounts (e2e)", () => {
  let app: INestApplication;
  let adminAuthHeader: string;
  const prisma = new PrismaClient();

  beforeAll(async () => {
    app = await createTestApp();
    adminAuthHeader = `Bearer ${signAdminToken(app)}`;
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  function uniqueUsername() {
    return `e2e-${randomUUID().slice(0, 8)}`;
  }

  it("POST /api/v1/auth/login sai mật khẩu -> 401", () => {
    return request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ username: "khong-ton-tai", password: "sai" })
      .expect(401);
  });

  it("POST /api/v1/auth/login đúng tài khoản -> 200 + accessToken dùng gọi API được", async () => {
    const username = uniqueUsername();
    await prisma.account.create({
      data: { username, passwordHash: await bcrypt.hash("mat-khau-that", 10), isAdmin: false },
    });

    const loginRes = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ username, password: "mat-khau-that" })
      .expect(200);

    expect(loginRes.body.accessToken).toBeDefined();
    expect(loginRes.body.account.username).toBe(username);

    await request(app.getHttpServer())
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${loginRes.body.accessToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.username).toBe(username);
      });
  });

  it("GET /api/v1/accounts không kèm token -> 401", () => {
    return request(app.getHttpServer()).get("/api/v1/accounts").expect(401);
  });

  it("Admin tạo tài khoản mới -> mật khẩu mặc định abc123, mặc định KHÔNG có quyền trên module nào", async () => {
    const username = uniqueUsername();

    const createRes = await request(app.getHttpServer())
      .post("/api/v1/accounts")
      .set("Authorization", adminAuthHeader)
      .send({ username })
      .expect(201);

    const loginRes = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ username, password: "abc123" })
      .expect(200);

    await request(app.getHttpServer())
      .get("/api/v1/leads")
      .set("Authorization", `Bearer ${loginRes.body.accessToken}`)
      .expect(403);

    // dọn lại tài khoản test vừa tạo
    await prisma.account.delete({ where: { id: createRes.body.id } });
  });

  it("Tài khoản chức năng chỉ truy cập được đúng module được cấp quyền", async () => {
    const username = uniqueUsername();
    const account = await prisma.account.create({
      data: { username, passwordHash: await bcrypt.hash("abc123", 10), isAdmin: false },
    });
    await prisma.permission.create({
      data: { accountId: account.id, module: "leads", canView: true, canEdit: true, canDelete: false },
    });

    const loginRes = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ username, password: "abc123" })
      .expect(200);
    const authHeader = `Bearer ${loginRes.body.accessToken}`;

    await request(app.getHttpServer())
      .get("/api/v1/leads")
      .set("Authorization", authHeader)
      .expect(200);

    await request(app.getHttpServer())
      .get("/api/v1/orders")
      .set("Authorization", authHeader)
      .expect(403);
  });
});
