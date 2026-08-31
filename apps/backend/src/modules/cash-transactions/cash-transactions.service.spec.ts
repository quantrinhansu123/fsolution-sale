import { randomUUID } from "crypto";
import { NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CashAccountsService } from "../cash-accounts/cash-accounts.service";
import { CashTransactionsService } from "./cash-transactions.service";

describe("CashTransactionsService", () => {
  const prisma = new PrismaService();
  const cashAccountsService = new CashAccountsService(prisma);
  const service = new CashTransactionsService(prisma);

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("create() ghi nhận dòng Thu/Chi khi cashAccountId hợp lệ", async () => {
    const cashAccount = await cashAccountsService.create({
      code: `CA-${randomUUID().slice(0, 8)}`,
      name: "Quỹ tiền mặt VN",
      type: "income",
    });

    const created = await service.create({
      cashAccountId: cashAccount.id,
      type: "income",
      content: "Thu tiền hợp đồng ORD-001",
      amount: 1000000,
      transactionDate: "2026-08-24",
    });
    expect(created.amount).toBe(1000000);

    const list = await service.list();
    expect(list.some((t) => t.id === created.id)).toBe(true);
  });

  it("create() ném NotFoundException khi cashAccountId không tồn tại", async () => {
    await expect(
      service.create({
        cashAccountId: randomUUID(),
        type: "expense",
        content: "Chi phí ads",
        amount: 500000,
        transactionDate: "2026-08-24",
      })
    ).rejects.toThrow(NotFoundException);
  });
});
