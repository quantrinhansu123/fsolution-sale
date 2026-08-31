import { randomUUID } from "crypto";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditLogsService } from "./audit-logs.service";

describe("AuditLogsService", () => {
  const prisma = new PrismaService();
  const service = new AuditLogsService(prisma);

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("record()/list() ghi và liệt kê đúng 1 dòng audit log", async () => {
    const recordId = randomUUID();
    await service.record({
      tableName: "Order",
      recordId,
      fieldChanged: "status",
      oldValue: "pending",
      newValue: "confirmed",
      changedBy: randomUUID(),
    });

    const list = await service.list();
    expect(list.some((l) => l.recordId === recordId && l.tableName === "Order")).toBe(true);
  });
});
