import { randomUUID } from "crypto";
import { BadRequestException, ConflictException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { OrdersService } from "./orders.service";

describe("OrdersService", () => {
  const prisma = new PrismaService();
  const service = new OrdersService(prisma, new AuditLogsService(prisma));

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("create() thêm order mới với status mặc định 'pending'", async () => {
    const customerId = randomUUID();
    const created = await service.create({ customerId, totalAmount: 1500000 });

    expect(created.id).toBeDefined();
    expect(created.status).toBe("pending");
    expect(created.totalAmount).toBe(1500000);
  });

  it("list() trả về order vừa tạo", async () => {
    const customerId = randomUUID();
    const created = await service.create({ customerId, totalAmount: 250000 });

    const orders = await service.list();
    expect(orders.some((o) => o.id === created.id)).toBe(true);
  });

  it("update() đổi status thành công khi đơn chưa khoá", async () => {
    const created = await service.create({ customerId: randomUUID(), totalAmount: 100000 });
    const updated = await service.update(created.id, { status: "confirmed" });
    expect(updated.status).toBe("confirmed");
  });

  it("update() ném ConflictException khi đơn đã delivered/cancelled (nguyên tắc #6 khoá sửa)", async () => {
    const created = await service.create({ customerId: randomUUID(), totalAmount: 100000 });
    await service.update(created.id, { status: "delivered" });

    await expect(service.update(created.id, { status: "confirmed" })).rejects.toThrow(
      ConflictException
    );
  });

  it("update() ném NotFoundException khi id không tồn tại", async () => {
    await expect(service.update(randomUUID(), { status: "confirmed" })).rejects.toThrow(
      NotFoundException
    );
  });

  it("update() đổi status tự ghi 1 dòng AuditLog (nguyên tắc #5)", async () => {
    const created = await service.create({ customerId: randomUUID(), totalAmount: 100000 });
    const changedBy = randomUUID();
    await service.update(created.id, { status: "confirmed" }, changedBy);

    const logs = await prisma.auditLog.findMany({ where: { tableName: "Order", recordId: created.id } });
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({
      fieldChanged: "status",
      oldValue: "pending",
      newValue: "confirmed",
      changedBy,
    });
  });

  it("addItem()/getItems() thêm và liệt kê đúng sản phẩm/quà tặng trong đơn", async () => {
    const created = await service.create({ customerId: randomUUID(), totalAmount: 500000 });

    await service.addItem(created.id, {
      productId: randomUUID(),
      productName: "Sàn gỗ Oak 12mm",
      quantity: 2,
      unitPrice: 250000,
    });
    await service.addItem(created.id, {
      productId: randomUUID(),
      productName: "Nẹp T (quà tặng)",
      quantity: 1,
      unitPrice: 0,
      isGift: true,
    });

    const items = await service.getItems(created.id);
    expect(items).toHaveLength(2);
    expect(items.some((i) => i.isGift)).toBe(true);
  });

  it("addItem() ném ConflictException khi đơn đã khoá", async () => {
    const created = await service.create({ customerId: randomUUID(), totalAmount: 100000 });
    await service.update(created.id, { status: "cancelled" });

    await expect(
      service.addItem(created.id, {
        productId: randomUUID(),
        productName: "X",
        quantity: 1,
        unitPrice: 1000,
      })
    ).rejects.toThrow(ConflictException);
  });

  it("create() với shippingPhone CHƯA tồn tại tự tạo Customer mới customerType=new (mới Phase 3)", async () => {
    const phone = `09${randomUUID().replace(/-/g, "").slice(0, 8)}`;
    const created = await service.create({
      customerName: "Khách Mới A",
      shippingPhone: phone,
      shippingAddress: "123 Láng Hạ",
      totalAmount: 500000,
      productId: randomUUID(),
      productName: "Sàn gỗ Oak 12mm",
      quantity: 2,
      unitPrice: 250000,
      discountPercent: 10,
    });

    const customer = await prisma.customer.findUnique({ where: { phone } });
    expect(customer).toMatchObject({ name: "Khách Mới A", customerType: "new" });
    expect(created.customerId).toBe(customer!.id);

    const items = await service.getItems(created.id);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ productName: "Sàn gỗ Oak 12mm", discountPercent: 10 });
  });

  it("create() sao chép unit vào OrderItem đầu tiên khi có truyền (mới)", async () => {
    const created = await service.create({
      customerId: randomUUID(),
      totalAmount: 500000,
      productId: randomUUID(),
      productName: "Sàn gỗ Oak 12mm",
      unit: "m2",
      quantity: 2,
      unitPrice: 250000,
    });

    const items = await service.getItems(created.id);
    expect(items[0]).toMatchObject({ unit: "m2" });
  });

  it("list() sao chép customerName/assignedToName vào response (mới)", async () => {
    const suffix = randomUUID().slice(0, 8);
    const customer = await prisma.customer.create({
      data: { name: "Khách Có Tên", phone: `09${suffix}`, customerType: "new" },
    });
    const employee = await prisma.employee.create({
      data: { name: "Sale Có Tên", email: `sale-${suffix}@test.local`, role: "Sale", status: "active" },
    });
    const created = await service.create({
      customerId: customer.id,
      assignedTo: employee.id,
      totalAmount: 100000,
    });

    const orders = await service.list();
    const found = orders.find((o) => o.id === created.id);
    expect(found).toMatchObject({ customerName: "Khách Có Tên", assignedToName: "Sale Có Tên" });
  });

  it("list() sao chép leadCode vào response để thống kê doanh thu theo Lead (mới)", async () => {
    const suffix = randomUUID().slice(0, 8);
    const lead = await prisma.lead.create({
      data: {
        code: suffix.slice(0, 4).toUpperCase(),
        name: "Khách Từ Lead",
        phone: `09${suffix}`,
        source: "Facebook Ads",
        status: "converted",
      },
    });
    const created = await service.create({
      customerId: randomUUID(),
      leadId: lead.id,
      totalAmount: 100000,
    });

    const orders = await service.list();
    const found = orders.find((o) => o.id === created.id);
    expect(found).toMatchObject({ leadId: lead.id, leadCode: lead.code });
  });

  it("addItem() sao chép unit vào OrderItem thêm sau (mới)", async () => {
    const created = await service.create({ customerId: randomUUID(), totalAmount: 500000 });

    await service.addItem(created.id, {
      productId: randomUUID(),
      productName: "Nẹp chữ T",
      unit: "thanh",
      quantity: 3,
      unitPrice: 45000,
    });

    const items = await service.getItems(created.id);
    expect(items[0]).toMatchObject({ unit: "thanh" });
  });

  it("create() với shippingPhone ĐÃ tồn tại cập nhật Customer customerType=old, không tạo trùng (mới Phase 3)", async () => {
    const phone = `09${randomUUID().replace(/-/g, "").slice(0, 8)}`;
    const existing = await prisma.customer.create({
      data: { name: "Khách Cũ", phone, customerType: "new" },
    });

    await service.create({ customerName: "Khách Cũ", shippingPhone: phone, totalAmount: 300000 });

    const customer = await prisma.customer.findUnique({ where: { phone } });
    expect(customer!.id).toBe(existing.id);
    expect(customer!.customerType).toBe("old");
    expect(await prisma.customer.count({ where: { phone } })).toBe(1);
  });

  it("create() không có customerId lẫn shippingPhone thì ném BadRequestException (mới Phase 3)", async () => {
    await expect(service.create({ totalAmount: 100000 })).rejects.toThrow(BadRequestException);
  });

  it("create() lưu leadId/assignedTo/shippingAddress/shippingPhone/note (mới Phase 3)", async () => {
    const lead = await prisma.lead.create({
      data: {
        name: "Lead hợp lệ cho test",
        phone: `09${randomUUID().replace(/-/g, "").slice(0, 8)}`,
        source: "Facebook Ads",
        status: "converted",
      },
    });
    const assignedTo = randomUUID();
    const explicitCustomerId = randomUUID();
    const phone = `09${randomUUID().replace(/-/g, "").slice(0, 8)}`;
    const created = await service.create({
      customerId: explicitCustomerId,
      totalAmount: 100000,
      leadId: lead.id,
      assignedTo,
      shippingAddress: "45 Nguyễn Trãi",
      shippingPhone: phone,
      note: "Giao trong giờ hành chính",
    });

    expect(created).toMatchObject({
      // customerId truyền tường minh phải được giữ nguyên, KHÔNG bị shippingPhone ghi đè
      // (finding thật bắt được lúc /review — trước đó shippingPhone luôn thắng dù đã có customerId).
      customerId: explicitCustomerId,
      leadId: lead.id,
      assignedTo,
      shippingAddress: "45 Nguyễn Trãi",
      shippingPhone: phone,
      note: "Giao trong giờ hành chính",
    });
    // Không được tự tạo Customer nào theo shippingPhone khi customerId đã được truyền tường minh.
    expect(await prisma.customer.findUnique({ where: { phone } })).toBeNull();
  });

  it("list() lọc theo Sale đăng nhập khi tài khoản link Employee role=Sale (không phải admin, mới Phase 3)", async () => {
    const suffix = randomUUID().slice(0, 8);
    const account = await prisma.account.create({
      data: { username: `order-sale-${suffix}`, passwordHash: "x", isAdmin: false },
    });
    const employee = await prisma.employee.create({
      data: { name: "Sale Đơn Hàng", email: `order-sale-${suffix}@test.local`, role: "Sale", status: "active", accountId: account.id },
    });
    const ownOrder = await service.create({ customerId: randomUUID(), totalAmount: 100000, assignedTo: employee.id });
    const otherEmployeeId = randomUUID();
    const otherOrder = await service.create({ customerId: randomUUID(), totalAmount: 200000, assignedTo: otherEmployeeId });

    const orders = await service.list({ sub: account.id, username: account.username, isAdmin: false });
    expect(orders.every((o) => o.assignedTo === employee.id)).toBe(true);
    expect(orders.some((o) => o.id === ownOrder.id)).toBe(true);

    // BẢO MẬT (finding Critical bắt được lúc /review): Sale không được phép ghi đè filter
    // qua query param assignedTo=<id Sale khác> để xem đơn của người khác.
    const bypassAttempt = await service.list(
      { sub: account.id, username: account.username, isAdmin: false },
      { assignedTo: otherEmployeeId }
    );
    expect(bypassAttempt.every((o) => o.assignedTo === employee.id)).toBe(true);
    expect(bypassAttempt.some((o) => o.id === otherOrder.id)).toBe(false);
  });

  it("create() với leadId ném BadRequestException nếu Lead không tồn tại (khớp contract, mới Phase 3)", async () => {
    await expect(
      service.create({ customerId: randomUUID(), totalAmount: 100000, leadId: randomUUID() })
    ).rejects.toThrow(BadRequestException);
  });

  it("create() với leadId ném BadRequestException nếu Lead chưa 'converted' (khớp contract, mới Phase 3)", async () => {
    const lead = await prisma.lead.create({
      data: { name: "Lead chưa chốt", phone: `09${randomUUID().replace(/-/g, "").slice(0, 8)}`, source: "Facebook Ads", status: "new" },
    });

    await expect(
      service.create({ customerId: randomUUID(), totalAmount: 100000, leadId: lead.id })
    ).rejects.toThrow(BadRequestException);
  });

  it("create() với leadId của Sale KHÁC ném BadRequestException khi người gọi là Sale bị giới hạn (mới Phase 3)", async () => {
    const suffix = randomUUID().slice(0, 8);
    const account = await prisma.account.create({
      data: { username: `order-lead-sale-${suffix}`, passwordHash: "x", isAdmin: false },
    });
    const myEmployee = await prisma.employee.create({
      data: { name: "Sale Của Tôi", email: `order-lead-sale-${suffix}@test.local`, role: "Sale", status: "active", accountId: account.id },
    });
    const otherLead = await prisma.lead.create({
      data: {
        name: "Lead của Sale khác",
        phone: `09${suffix}9`,
        source: "Facebook Ads",
        status: "converted",
        assignedTo: randomUUID(),
      },
    });

    await expect(
      service.create(
        { customerId: randomUUID(), totalAmount: 100000, leadId: otherLead.id },
        { sub: account.id, username: account.username, isAdmin: false }
      )
    ).rejects.toThrow(BadRequestException);

    // Lead converted VÀ đúng của chính Sale này thì phải cho qua
    const ownLead = await prisma.lead.create({
      data: {
        name: "Lead của chính tôi",
        phone: `09${suffix}8`,
        source: "Facebook Ads",
        status: "converted",
        assignedTo: myEmployee.id,
      },
    });
    const created = await service.create(
      { customerId: randomUUID(), totalAmount: 100000, leadId: ownLead.id },
      { sub: account.id, username: account.username, isAdmin: false }
    );
    expect(created.leadId).toBe(ownLead.id);
  });
});
