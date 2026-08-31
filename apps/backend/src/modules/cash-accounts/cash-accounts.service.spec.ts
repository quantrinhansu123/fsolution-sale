import { randomUUID } from "crypto";
import { ConflictException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CashAccountsService } from "./cash-accounts.service";

describe("CashAccountsService", () => {
  const prisma = new PrismaService();
  const service = new CashAccountsService(prisma);

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  function uniqueCode() {
    return `CA-${randomUUID().slice(0, 8)}`;
  }

  it("create() thêm mã tài khoản mới", async () => {
    const code = uniqueCode();
    const created = await service.create({ code, name: "Quỹ tiền mặt VN", type: "income" });
    expect(created.code).toBe(code);
    expect(created.active).toBe(true);
  });

  it("create() trùng code ném ConflictException", async () => {
    const code = uniqueCode();
    await service.create({ code, name: "A", type: "income" });
    await expect(service.create({ code, name: "B", type: "expense" })).rejects.toThrow(ConflictException);
  });
});
