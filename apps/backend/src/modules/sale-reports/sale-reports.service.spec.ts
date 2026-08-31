import { randomUUID } from "crypto";
import { PrismaService } from "../../prisma/prisma.service";
import { SaleReportsService } from "./sale-reports.service";

describe("SaleReportsService", () => {
  const prisma = new PrismaService();
  const service = new SaleReportsService(prisma);

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("create() thêm báo cáo Sale mới với default count = 0", async () => {
    const created = await service.create({
      employeeId: randomUUID(),
      date: "2026-08-01",
      shift: "sáng",
      product: "SGO-OAK-12MM",
      market: "US",
      messageCount: 50,
      orderCount: 5,
      revenueActual: 12500000,
    });

    expect(created.id).toBeDefined();
    expect(created.orderCancelCount).toBe(0);
    expect(created.newCustomerCount).toBe(0);
    expect(created.date.toISOString().slice(0, 10)).toBe("2026-08-01");
  });

  it("list() trả về báo cáo vừa tạo", async () => {
    const created = await service.create({
      employeeId: randomUUID(),
      date: "2026-08-02",
      shift: "chiều",
      product: "SNHUA-SPC-4MM",
      market: "CAN",
      messageCount: 30,
      orderCount: 3,
      revenueActual: 7500000,
      orderCancelCount: 1,
    });

    const reports = await service.list();
    expect(reports.some((r) => r.id === created.id)).toBe(true);
  });

  it("getAuto() tính đúng số liệu tổng hợp theo Ngày + Sale từ Lead/LeadLog/Order/OrderItem/Customer (mới Phase 3)", async () => {
    const suffix = randomUUID().slice(0, 8);
    const employee = await prisma.employee.create({
      data: { name: "Sale Auto Report", email: `sale-auto-${suffix}@test.local`, role: "Sale", status: "active" },
    });

    const lead1 = await prisma.lead.create({
      data: { name: "L1", phone: `09${suffix}1`, source: "Facebook Ads", assignedTo: employee.id },
    });
    await prisma.lead.create({
      data: { name: "L2", phone: `09${suffix}2`, source: "Facebook Ads", assignedTo: employee.id },
    });
    await prisma.leadLog.create({ data: { leadId: lead1.id, fromStatus: "new", toStatus: "contacted", fieldChanged: "status" } });
    await prisma.leadLog.create({ data: { leadId: lead1.id, fromStatus: "contacted", toStatus: "converted", fieldChanged: "status" } });

    const customerNew = await prisma.customer.create({ data: { name: "Khách mới", phone: `09${suffix}3`, customerType: "new" } });
    const customerOld = await prisma.customer.create({ data: { name: "Khách cũ", phone: `09${suffix}4`, customerType: "old" } });

    await prisma.order.create({
      data: {
        customerId: customerNew.id,
        assignedTo: employee.id,
        totalAmount: 1000000,
        status: "confirmed",
        items: { create: [{ productId: randomUUID(), productName: "P1", quantity: 2, unitPrice: 500000 }] },
      },
    });
    await prisma.order.create({
      data: {
        customerId: customerOld.id,
        assignedTo: employee.id,
        totalAmount: 500000,
        status: "pending",
        items: { create: [{ productId: randomUUID(), productName: "P2", quantity: 1, unitPrice: 500000 }] },
      },
    });

    const today = new Date().toISOString().slice(0, 10);
    const reports = await service.getAuto(today);
    const report = reports.find((r) => r.employeeId === employee.id);

    expect(report).toMatchObject({
      employeeName: "Sale Auto Report",
      newLeadsAssigned: 2,
      leadsToContacted: 1,
      leadsToQualified: 0,
      leadsToConverted: 1,
      leadsToLost: 0,
      orderCount: 2,
      productsSold: 3,
      revenueTotal: 1500000,
      revenueConfirmed: 1000000,
      newCustomers: 1,
      returningCustomers: 1,
    });
  });

  it("getAuto() với toDate gộp số liệu theo khoảng nhiều ngày (mới)", async () => {
    const suffix = randomUUID().slice(0, 8);
    const employee = await prisma.employee.create({
      data: { name: "Sale Range Report", email: `sale-range-${suffix}@test.local`, role: "Sale", status: "active" },
    });

    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    await prisma.lead.create({
      data: {
        name: "Lead 2 ngày trước",
        phone: `09${suffix}`,
        source: "Facebook Ads",
        assignedTo: employee.id,
        createdAt: twoDaysAgo,
      },
    });

    const todayStr = new Date().toISOString().slice(0, 10);
    const fromStr = twoDaysAgo.toISOString().slice(0, 10);

    const singleDayReports = await service.getAuto(todayStr);
    const singleDayReport = singleDayReports.find((r) => r.employeeId === employee.id);
    expect(singleDayReport?.newLeadsAssigned ?? 0).toBe(0);

    const rangeReports = await service.getAuto(fromStr, todayStr);
    const rangeReport = rangeReports.find((r) => r.employeeId === employee.id);
    expect(rangeReport?.newLeadsAssigned).toBe(1);
  });

  it("getAuto() không trả về gì cho Sale không active hoặc không có dữ liệu ngày đó", async () => {
    const suffix = randomUUID().slice(0, 8);
    const inactive = await prisma.employee.create({
      data: { name: "Sale Nghỉ", email: `sale-inactive-${suffix}@test.local`, role: "Sale", status: "inactive" },
    });

    const today = new Date().toISOString().slice(0, 10);
    const reports = await service.getAuto(today);
    expect(reports.some((r) => r.employeeId === inactive.id)).toBe(false);
  });
});
