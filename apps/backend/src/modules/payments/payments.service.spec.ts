import { randomUUID } from "crypto";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { PaymentsService } from "./payments.service";

describe("PaymentsService", () => {
  const prisma = new PrismaService();
  const service = new PaymentsService(prisma, new AuditLogsService(prisma));

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("create() thêm khoản thu mới với status mặc định 'pending'", async () => {
    const created = await service.create({ orderId: randomUUID(), amount: 500000 });
    expect(created.status).toBe("pending");
  });

  it("update() ném BadRequestException khi set completed mà chưa có reconciledAt", async () => {
    const created = await service.create({ orderId: randomUUID(), amount: 500000 });
    await expect(service.update(created.id, { status: "completed" })).rejects.toThrow(BadRequestException);
  });

  it("update() cho phép completed khi truyền kèm reconciledAt", async () => {
    const created = await service.create({ orderId: randomUUID(), amount: 500000 });
    const updated = await service.update(created.id, {
      status: "completed",
      reconciledAt: new Date().toISOString(),
    });
    expect(updated.status).toBe("completed");
    expect(updated.reconciledAt).not.toBeNull();
  });

  it("update() ném NotFoundException khi id không tồn tại", async () => {
    await expect(service.update(randomUUID(), { status: "failed" })).rejects.toThrow(NotFoundException);
  });

  it("update() đổi status tự ghi 1 dòng AuditLog (nguyên tắc #5)", async () => {
    const created = await service.create({ orderId: randomUUID(), amount: 500000 });
    const changedBy = randomUUID();
    await service.update(created.id, { status: "completed", reconciledAt: new Date().toISOString() }, changedBy);

    const logs = await prisma.auditLog.findMany({ where: { tableName: "Payment", recordId: created.id } });
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({ fieldChanged: "status", oldValue: "pending", newValue: "completed", changedBy });
  });
});
