import { randomUUID } from "crypto";
import { ConflictException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { EmployeesService } from "./employees.service";

describe("EmployeesService", () => {
  const prisma = new PrismaService();
  const service = new EmployeesService(prisma, new AuditLogsService(prisma));

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  function uniqueEmail() {
    return `test-${randomUUID().slice(0, 8)}@fsolution.test`;
  }

  it("create() thêm nhân sự mới với status mặc định 'active'", async () => {
    const created = await service.create({ name: "Nguyen Van A", email: uniqueEmail(), role: "Sale" });
    expect(created.status).toBe("active");
  });

  it("create() trùng email ném ConflictException", async () => {
    const email = uniqueEmail();
    await service.create({ name: "A", email, role: "MKT" });
    await expect(service.create({ name: "B", email, role: "CS" })).rejects.toThrow(ConflictException);
  });

  it("update() sửa team/branch/status thành công", async () => {
    const created = await service.create({ name: "C", email: uniqueEmail(), role: "CSKH" });
    const updated = await service.update(created.id, { team: "Team A", branch: "HN", status: "inactive" });
    expect(updated.team).toBe("Team A");
    expect(updated.status).toBe("inactive");
  });

  it("update() ném NotFoundException khi id không tồn tại", async () => {
    await expect(service.update(randomUUID(), { team: "X" })).rejects.toThrow(NotFoundException);
  });

  it("update() đổi status tự ghi 1 dòng AuditLog (nguyên tắc #5)", async () => {
    const created = await service.create({ name: "D", email: uniqueEmail(), role: "Sale" });
    const changedBy = randomUUID();
    await service.update(created.id, { status: "inactive" }, changedBy);

    const logs = await prisma.auditLog.findMany({ where: { tableName: "Employee", recordId: created.id } });
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({ fieldChanged: "status", oldValue: "active", newValue: "inactive", changedBy });
  });

  it("update() chỉ sửa team (không đổi role/status) thì không ghi AuditLog nào", async () => {
    const created = await service.create({ name: "E", email: uniqueEmail(), role: "Sale" });
    await service.update(created.id, { team: "Team B" });

    const logs = await prisma.auditLog.findMany({ where: { tableName: "Employee", recordId: created.id } });
    expect(logs).toHaveLength(0);
  });
});
