import { randomUUID } from "crypto";
import { PrismaService } from "../../prisma/prisma.service";
import { MarketingReportsService } from "./marketing-reports.service";

describe("MarketingReportsService", () => {
  const prisma = new PrismaService();
  const service = new MarketingReportsService(prisma);

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("create() thêm báo cáo MKT mới", async () => {
    const created = await service.create({
      date: "2026-08-05",
      shift: "sáng",
      product: "SGO-OAK-12MM",
      market: "US",
      team: "Team A",
      adCost: 3000000,
      messageCount: 100,
      orderCount: 8,
      revenue: 20000000,
      revenueActual: 18000000,
    });

    expect(created.id).toBeDefined();
    expect(created.date.toISOString().slice(0, 10)).toBe("2026-08-05");
  });

  it("list() trả về báo cáo vừa tạo", async () => {
    const created = await service.create({
      date: "2026-08-06",
      shift: "chiều",
      product: "SNHUA-SPC-4MM",
      market: "CAN",
      team: "Team B",
      adCost: 1500000,
      messageCount: 60,
      orderCount: 4,
      revenue: 10000000,
      revenueActual: 9000000,
      warning: "CP Ads tăng bất thường",
    });

    const reports = await service.list();
    expect(reports.some((r) => r.id === created.id)).toBe(true);
  });

  it("getAuto() tính doanh thu Marketing bằng cách map Lead.sourcedBy với doanh thu Order gắn Lead đó (mới)", async () => {
    const suffix = randomUUID().slice(0, 8);
    const mkt = await prisma.employee.create({
      data: { name: "MKT Auto Report", email: `mkt-auto-${suffix}@test.local`, role: "MKT", status: "active" },
    });
    const lead = await prisma.lead.create({
      data: { name: "Lead MKT Auto", phone: `09${suffix}`, source: "Facebook Ads", sourcedBy: mkt.id, status: "converted" },
    });
    const customer = await prisma.customer.create({
      data: { name: "KH MKT Auto", phone: `08${suffix}`, customerType: "new" },
    });
    await prisma.order.create({
      data: { customerId: customer.id, leadId: lead.id, status: "delivered", totalAmount: 3_000_000 },
    });
    await prisma.order.create({
      data: { customerId: customer.id, leadId: lead.id, status: "pending", totalAmount: 9_000_000 }, // pending không tính
    });

    const today = new Date().toISOString().slice(0, 10);
    const reports = await service.getAuto(today);
    const report = reports.find((r) => r.employeeId === mkt.id);

    expect(report).toMatchObject({ employeeName: "MKT Auto Report", leadCount: 1, orderCount: 1, revenue: 3_000_000 });
  });

  it("getAuto() với toDate gộp doanh thu theo khoảng nhiều ngày (mới)", async () => {
    const suffix = randomUUID().slice(0, 8);
    const mkt = await prisma.employee.create({
      data: { name: "MKT Range Report", email: `mkt-range-${suffix}@test.local`, role: "MKT", status: "active" },
    });
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    const lead = await prisma.lead.create({
      data: {
        name: "Lead MKT Range",
        phone: `09${suffix}`,
        source: "Facebook Ads",
        sourcedBy: mkt.id,
        status: "converted",
        createdAt: twoDaysAgo,
      },
    });
    const customer = await prisma.customer.create({
      data: { name: "KH MKT Range", phone: `08${suffix}`, customerType: "new" },
    });
    await prisma.order.create({
      data: { customerId: customer.id, leadId: lead.id, status: "confirmed", totalAmount: 1_500_000, createdAt: twoDaysAgo },
    });

    const todayStr = new Date().toISOString().slice(0, 10);
    const fromStr = twoDaysAgo.toISOString().slice(0, 10);

    const singleDayReports = await service.getAuto(todayStr);
    const singleDayReport = singleDayReports.find((r) => r.employeeId === mkt.id);
    expect(singleDayReport?.revenue ?? 0).toBe(0);

    const rangeReports = await service.getAuto(fromStr, todayStr);
    const rangeReport = rangeReports.find((r) => r.employeeId === mkt.id);
    expect(rangeReport?.revenue).toBe(1_500_000);
    expect(rangeReport?.leadCount).toBe(1);
  });
});
