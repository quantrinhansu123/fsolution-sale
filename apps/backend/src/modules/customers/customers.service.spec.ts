import { randomUUID } from "crypto";
import { ConflictException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { CustomersService } from "./customers.service";

describe("CustomersService", () => {
  const prisma = new PrismaService();
  const service = new CustomersService(prisma, new AuditLogsService(prisma));

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  function uniquePhone() {
    return `09${randomUUID().replace(/-/g, "").slice(0, 8)}`;
  }

  it("create() thêm khách hàng mới với customerType mặc định 'new'", async () => {
    const phone = uniquePhone();
    const created = await service.create({ name: "Nguyễn Văn A", phone });

    expect(created.id).toBeDefined();
    expect(created.customerType).toBe("new");
    expect(created.blacklistStatus).toBe(false);
  });

  it("list() trả về khách hàng vừa tạo", async () => {
    const phone = uniquePhone();
    const created = await service.create({ name: "Trần Thị B", phone });

    const customers = await service.list();
    expect(customers.some((c) => c.id === created.id)).toBe(true);
  });

  it("create() ném ConflictException khi phone đã tồn tại (chuẩn hoá, tránh trùng khách)", async () => {
    const phone = uniquePhone();
    await service.create({ name: "Lê Văn C", phone });

    await expect(service.create({ name: "Lê Văn C (trùng)", phone })).rejects.toThrow(
      ConflictException
    );
  });

  it("update() sửa địa chỉ/blacklistStatus thành công", async () => {
    const created = await service.create({ name: "Phạm Thị D", phone: uniquePhone() });
    const updated = await service.update(created.id, { address: "123 Láng Hạ", blacklistStatus: true });

    expect(updated.address).toBe("123 Láng Hạ");
    expect(updated.blacklistStatus).toBe(true);
  });

  it("update() ném NotFoundException khi id không tồn tại", async () => {
    await expect(service.update(randomUUID(), { address: "x" })).rejects.toThrow(NotFoundException);
  });

  it("update() tự ghi AuditLog cho từng field thay đổi (mới Phase 3)", async () => {
    const created = await service.create({ name: "Vũ Thị E", phone: uniquePhone() });
    const changedBy = randomUUID();
    await service.update(created.id, { blacklistStatus: true }, changedBy);

    const logs = await prisma.auditLog.findMany({ where: { tableName: "Customer", recordId: created.id } });
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({ fieldChanged: "blacklistStatus", oldValue: "false", newValue: "true", changedBy });
  });
});
