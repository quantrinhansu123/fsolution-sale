import { randomUUID } from "crypto";
import { NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { LeadsService } from "./leads.service";

describe("LeadsService", () => {
  const prisma = new PrismaService();
  const auditLogsService = new AuditLogsService(prisma);
  const service = new LeadsService(prisma, auditLogsService);

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("create() thêm lead mới với status mặc định 'new' và tự sinh code 4 ký tự", async () => {
    const phone = `09${randomUUID().replace(/-/g, "").slice(0, 8)}`;
    const created = await service.create({ name: "Nguyễn Văn A", phone, source: "Facebook Ads" });

    expect(created.id).toBeDefined();
    expect(created.status).toBe("new");
    expect(created.phone).toBe(phone);
    expect(created.code).toMatch(/^[A-Z0-9]{4}$/);
  });

  it("create() nhận productInterest/threadId (mới Phase 3)", async () => {
    const phone = `09${randomUUID().replace(/-/g, "").slice(0, 8)}`;
    const created = await service.create({
      name: "Nguyễn Văn Interest",
      phone,
      source: "Facebook Ads",
      productInterest: "Sàn gỗ Oak 12mm",
      threadId: "pancake-thread-123",
    });

    expect(created.productInterest).toBe("Sàn gỗ Oak 12mm");
    expect(created.threadId).toBe("pancake-thread-123");
  });

  it("create() tự động round-robin assignedTo theo Employee role=Sale, status=active (không bao giờ chọn Sale inactive/role khác)", async () => {
    const suffix = randomUUID().slice(0, 8);
    const activeSale = await prisma.employee.create({
      data: { name: "Sale Active", email: `sale-active-${suffix}@test.local`, role: "Sale", status: "active" },
    });
    await prisma.employee.create({
      data: { name: "Sale Inactive", email: `sale-inactive-${suffix}@test.local`, role: "Sale", status: "inactive" },
    });
    await prisma.employee.create({
      data: { name: "MKT Active", email: `mkt-active-${suffix}@test.local`, role: "MKT", status: "active" },
    });

    const activeSaleIds = (
      await prisma.employee.findMany({ where: { role: "Sale", status: "active" } })
    ).map((e) => e.id);

    const created = await service.create({
      name: "Round Robin",
      phone: `09${randomUUID().replace(/-/g, "").slice(0, 8)}`,
      source: "Facebook Ads",
    });

    expect(created.assignedTo).not.toBeNull();
    expect(activeSaleIds).toContain(created.assignedTo);
    expect(activeSaleIds).toContain(activeSale.id);
  });

  it("create() tự động round-robin sourcedBy theo Employee role=MKT, status=active (mới)", async () => {
    const suffix = randomUUID().slice(0, 8);
    const activeMkt = await prisma.employee.create({
      data: { name: "MKT Active RR", email: `mkt-active-rr-${suffix}@test.local`, role: "MKT", status: "active" },
    });
    await prisma.employee.create({
      data: { name: "MKT Inactive RR", email: `mkt-inactive-rr-${suffix}@test.local`, role: "MKT", status: "inactive" },
    });

    const activeMktIds = (
      await prisma.employee.findMany({ where: { role: "MKT", status: "active" } })
    ).map((e) => e.id);

    const created = await service.create({
      name: "Round Robin MKT",
      phone: `09${randomUUID().replace(/-/g, "").slice(0, 8)}`,
      source: "Facebook Ads",
    });

    expect(created.sourcedBy).not.toBeNull();
    expect(activeMktIds).toContain(created.sourcedBy);
    expect(activeMktIds).toContain(activeMkt.id);
  });

  it("create() với sourcedBy truyền tay dùng đúng giá trị đó, không round-robin (mới)", async () => {
    const suffix = randomUUID().slice(0, 8);
    const chosenMkt = await prisma.employee.create({
      data: { name: "MKT Chọn Tay", email: `mkt-chosen-${suffix}@test.local`, role: "MKT", status: "active" },
    });
    await prisma.employee.create({
      data: { name: "MKT Khác", email: `mkt-other-${suffix}@test.local`, role: "MKT", status: "active" },
    });

    const created = await service.create({
      name: "Lead Chọn Tay MKT",
      phone: `09${randomUUID().replace(/-/g, "").slice(0, 8)}`,
      source: "Facebook Ads",
      sourcedBy: chosenMkt.id,
    });

    expect(created.sourcedBy).toBe(chosenMkt.id);
  });

  it("list() trả về lead vừa tạo", async () => {
    const phone = `09${randomUUID().replace(/-/g, "").slice(0, 8)}`;
    const created = await service.create({ name: "Trần Thị B", phone, source: "Pancake" });

    const leads = await service.list();
    expect(leads.some((l) => l.id === created.id)).toBe(true);
  });

  it("list() lọc theo Sale đăng nhập khi tài khoản link Employee role=Sale (không phải admin)", async () => {
    const suffix = randomUUID().slice(0, 8);
    const account = await prisma.account.create({
      data: { username: `sale-acc-${suffix}`, passwordHash: "x", isAdmin: false },
    });
    const employee = await prisma.employee.create({
      data: { name: "Sale Riêng", email: `sale-riêng-${suffix}@test.local`, role: "Sale", status: "active", accountId: account.id },
    });
    const ownLead = await prisma.lead.create({
      data: { name: "Lead của Sale này", phone: `09${suffix}1`, source: "Facebook Ads", assignedTo: employee.id },
    });
    await prisma.lead.create({
      data: { name: "Lead của Sale khác", phone: `09${suffix}2`, source: "Facebook Ads", assignedTo: randomUUID() },
    });

    const leads = await service.list({ sub: account.id, username: account.username, isAdmin: false });
    expect(leads.every((l) => l.assignedTo === employee.id)).toBe(true);
    expect(leads.some((l) => l.id === ownLead.id)).toBe(true);

    // BẢO MẬT (finding Critical bắt được lúc /review): Sale không được phép ghi đè filter
    // qua query param assignedTo=<id Sale khác> để xem lead của người khác — phải LUÔN bị ép về
    // chính mình, bất kể client truyền gì.
    const otherEmployeeId = (
      await prisma.lead.findFirst({ where: { phone: `09${suffix}2` } })
    )?.assignedTo;
    const bypassAttempt = await service.list(
      { sub: account.id, username: account.username, isAdmin: false },
      { assignedTo: otherEmployeeId! }
    );
    expect(bypassAttempt.every((l) => l.assignedTo === employee.id)).toBe(true);
    expect(bypassAttempt.some((l) => l.assignedTo === otherEmployeeId)).toBe(false);
  });

  it("list() lọc theo MKT đăng nhập khi tài khoản link Employee role=MKT (không phải admin)", async () => {
    const suffix = randomUUID().slice(0, 8);
    const account = await prisma.account.create({
      data: { username: `test-mkt-acc-${suffix}`, passwordHash: "x", isAdmin: false },
    });
    const employee = await prisma.employee.create({
      data: { name: "MKT Riêng", email: `mkt-riêng-${suffix}@test.local`, role: "MKT", status: "active", accountId: account.id },
    });
    const ownLead = await prisma.lead.create({
      data: { name: "Lead do MKT này nguồn", phone: `09${suffix}3`, source: "Facebook Ads", sourcedBy: employee.id },
    });
    const otherLead = await prisma.lead.create({
      data: { name: "Lead do MKT khác nguồn", phone: `09${suffix}4`, source: "Facebook Ads", sourcedBy: randomUUID() },
    });

    try {
      const leads = await service.list({ sub: account.id, username: account.username, isAdmin: false });
      expect(leads.every((l) => l.sourcedBy === employee.id)).toBe(true);
      expect(leads.some((l) => l.id === ownLead.id)).toBe(true);

      // BẢO MẬT: cùng lỗi bypass đã fix cho Sale — MKT không được ghi đè filter qua query param
      // để xem lead do MKT khác nguồn, dù client truyền assignedTo/sourcedBy gì đi nữa.
      const bypassAttempt = await service.list(
        { sub: account.id, username: account.username, isAdmin: false },
        { assignedTo: otherLead.sourcedBy! }
      );
      expect(bypassAttempt.every((l) => l.sourcedBy === employee.id)).toBe(true);
      expect(bypassAttempt.some((l) => l.id === otherLead.id)).toBe(false);
    } finally {
      await prisma.lead.deleteMany({ where: { id: { in: [ownLead.id, otherLead.id] } } });
      await prisma.employee.delete({ where: { id: employee.id } });
      await prisma.account.delete({ where: { id: account.id } });
    }
  });

  it("update() đổi status thì tự ghi LeadLog (fromStatus/toStatus đúng)", async () => {
    const phone = `09${randomUUID().replace(/-/g, "").slice(0, 8)}`;
    const created = await service.create({ name: "Lê Văn C", phone, source: "Zalo OA" });

    const updated = await service.update(created.id, { status: "contacted", note: "Đã gọi tư vấn" });
    expect(updated.status).toBe("contacted");

    const logs = await service.getLogs(created.id);
    expect(logs).toHaveLength(1);
    expect(logs[0]).toEqual(
      expect.objectContaining({ fromStatus: "new", toStatus: "contacted", note: "Đã gọi tư vấn", fieldChanged: "status" })
    );
  });

  it("update() đổi assignedTo (mới Phase 3) GHI LeadLog với fieldChanged=assignedTo", async () => {
    const phone = `09${randomUUID().replace(/-/g, "").slice(0, 8)}`;
    const created = await service.create({ name: "Phạm Thị D", phone, source: "Facebook Ads" });
    const saleId = randomUUID();

    await service.update(created.id, { assignedTo: saleId });

    const logs = await service.getLogs(created.id);
    expect(logs).toHaveLength(1);
    expect(logs[0]).toEqual(
      expect.objectContaining({ fieldChanged: "assignedTo", oldValue: created.assignedTo, newValue: saleId, toStatus: null })
    );
  });

  it("update()/getLogs() ném NotFoundException khi id không tồn tại", async () => {
    await expect(service.update(randomUUID(), { status: "contacted" })).rejects.toThrow(
      NotFoundException
    );
    await expect(service.getLogs(randomUUID())).rejects.toThrow(NotFoundException);
  });
});
