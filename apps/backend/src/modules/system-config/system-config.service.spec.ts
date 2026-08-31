import { randomUUID } from "crypto";
import { NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { SystemConfigService } from "./system-config.service";

describe("SystemConfigService", () => {
  const prisma = new PrismaService();
  const service = new SystemConfigService(prisma, new AuditLogsService(prisma));

  beforeAll(async () => {
    await prisma.$connect();
    await service.onModuleInit();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("onModuleInit() seed sẵn 2 cấu hình mặc định (idempotent)", async () => {
    const list = await service.list();
    expect(list.some((c) => c.key === "exchange_rate_usd")).toBe(true);
    expect(list.some((c) => c.key === "low_stock_threshold")).toBe(true);

    // Gọi lại onModuleInit() không được ghi đè giá trị đã có (idempotent).
    await service.onModuleInit();
    const listAgain = await service.list();
    expect(listAgain.filter((c) => c.key === "exchange_rate_usd")).toHaveLength(1);
  });

  it("update() sửa value theo key thành công", async () => {
    const updated = await service.update("exchange_rate_usd", { value: "25000" });
    expect(updated.value).toBe("25000");
  });

  it("update() ném NotFoundException khi key không tồn tại", async () => {
    await expect(service.update(`unknown-${randomUUID()}`, { value: "1" })).rejects.toThrow(NotFoundException);
  });

  it("update() đổi value tự ghi 1 dòng AuditLog (nguyên tắc #5)", async () => {
    const before = await service.list();
    const config = before.find((c) => c.key === "low_stock_threshold")!;
    const changedBy = randomUUID();
    // Giá trị mới phải khác giá trị hiện tại (không giả định "10") để chắc chắn update() thực sự
    // đổi value và ghi log — DB dev dùng chung có thể còn giá trị sót lại từ lần chạy test trước.
    const newValue = config.value === "77" ? "88" : "77";

    await service.update("low_stock_threshold", { value: newValue }, changedBy);

    const logs = await prisma.auditLog.findMany({
      where: { tableName: "SystemConfig", recordId: config.id },
      orderBy: { createdAt: "desc" },
    });
    expect(logs.length).toBeGreaterThanOrEqual(1);
    expect(logs[0]).toMatchObject({ fieldChanged: "value", newValue, changedBy });
  });
});
