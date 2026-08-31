import { randomUUID } from "crypto";
import { NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { CampaignsService } from "./campaigns.service";

describe("CampaignsService", () => {
  const prisma = new PrismaService();
  const service = new CampaignsService(prisma, new AuditLogsService(prisma));

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("create() thêm chiến dịch mới với status mặc định 'active'", async () => {
    const created = await service.create({ name: `Chiến dịch ${randomUUID().slice(0, 8)}`, budget: 50000000 });

    expect(created.id).toBeDefined();
    expect(created.status).toBe("active");
    expect(created.budget).toBe(50000000);
  });

  it("list() trả về chiến dịch vừa tạo", async () => {
    const created = await service.create({ name: `Chiến dịch ${randomUUID().slice(0, 8)}`, budget: 10000000 });

    const campaigns = await service.list();
    expect(campaigns.some((c) => c.id === created.id)).toBe(true);
  });

  it("update() đổi status/budget thành công", async () => {
    const created = await service.create({ name: `Chiến dịch ${randomUUID().slice(0, 8)}`, budget: 20000000 });
    const updated = await service.update(created.id, { status: "paused", budget: 15000000 });

    expect(updated.status).toBe("paused");
    expect(updated.budget).toBe(15000000);
  });

  it("update() ném NotFoundException khi id không tồn tại", async () => {
    await expect(service.update(randomUUID(), { status: "paused" })).rejects.toThrow(NotFoundException);
  });

  it("update() tự ghi AuditLog cho từng field thay đổi (mới Phase 3)", async () => {
    const created = await service.create({ name: `Chiến dịch ${randomUUID().slice(0, 8)}`, budget: 20000000 });
    const changedBy = randomUUID();
    await service.update(created.id, { status: "paused", budget: 15000000 }, changedBy);

    const logs = await prisma.auditLog.findMany({ where: { tableName: "Campaign", recordId: created.id } });
    expect(logs).toHaveLength(2);
    expect(logs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ fieldChanged: "status", oldValue: "active", newValue: "paused", changedBy }),
        expect.objectContaining({ fieldChanged: "budget", oldValue: "20000000", newValue: "15000000", changedBy }),
      ])
    );
  });
});
