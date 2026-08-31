import { randomUUID } from "crypto";
import { JwtService } from "@nestjs/jwt";
import { UnauthorizedException } from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../../prisma/prisma.service";
import { AuthService } from "./auth.service";

describe("AuthService", () => {
  const prisma = new PrismaService();
  const jwtService = new JwtService({ secret: "test-secret", signOptions: { expiresIn: "8h" } });
  const service = new AuthService(prisma, jwtService);

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  async function createAccount(password: string, isAdmin = false) {
    const username = `test-${randomUUID().slice(0, 8)}`;
    const passwordHash = await bcrypt.hash(password, 10);
    return prisma.account.create({ data: { username, passwordHash, isAdmin } });
  }

  it("validateAccount() trả về account đúng khi mật khẩu đúng", async () => {
    const account = await createAccount("secret123");
    const result = await service.validateAccount(account.username, "secret123");
    expect(result.id).toBe(account.id);
  });

  it("validateAccount() ném UnauthorizedException khi sai mật khẩu", async () => {
    const account = await createAccount("secret123");
    await expect(service.validateAccount(account.username, "wrong")).rejects.toThrow(
      UnauthorizedException
    );
  });

  it("validateAccount() ném UnauthorizedException khi username không tồn tại", async () => {
    await expect(service.validateAccount("khong-ton-tai", "abc123")).rejects.toThrow(
      UnauthorizedException
    );
  });

  it("issueToken() sinh accessToken giải mã đúng payload isAdmin", async () => {
    const account = await createAccount("secret123", true);
    const { accessToken, account: profile } = service.issueToken(account);

    expect(profile.isAdmin).toBe(true);
    const decoded = jwtService.verify(accessToken) as { sub: string; isAdmin: boolean };
    expect(decoded.sub).toBe(account.id);
    expect(decoded.isAdmin).toBe(true);
  });

  it("changePassword() đổi mật khẩu thành công rồi mật khẩu cũ không còn dùng được", async () => {
    const account = await createAccount("old-pass");
    await service.changePassword(account.id, "old-pass", "new-pass");

    await expect(service.validateAccount(account.username, "old-pass")).rejects.toThrow(
      UnauthorizedException
    );
    const result = await service.validateAccount(account.username, "new-pass");
    expect(result.id).toBe(account.id);
  });

  it("changePassword() ném UnauthorizedException khi mật khẩu cũ sai", async () => {
    const account = await createAccount("old-pass");
    await expect(service.changePassword(account.id, "sai-mat-khau", "new-pass")).rejects.toThrow(
      UnauthorizedException
    );
  });

  it("getProfile()/changePassword() ném UnauthorizedException (không phải lỗi 500 thô) khi tài khoản đã bị xoá nhưng token còn hạn", async () => {
    const account = await createAccount("secret123");
    await prisma.account.delete({ where: { id: account.id } });

    await expect(service.getProfile(account.id)).rejects.toThrow(UnauthorizedException);
    await expect(service.changePassword(account.id, "secret123", "new-pass")).rejects.toThrow(
      UnauthorizedException
    );
  });
});
