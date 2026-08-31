import { randomUUID } from "crypto";
import { PrismaService } from "../../prisma/prisma.service";
import { DashboardService } from "./dashboard.service";

describe("DashboardService", () => {
  const prisma = new PrismaService();
  const service = new DashboardService(prisma);

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("getOverview() trả về đúng 5 kỳ (nhãn) và đủ 7 nhóm dữ liệu", async () => {
    const overview = await service.getOverview("month");

    expect(overview.periods).toHaveLength(5);
    expect(overview.revenueCostProfit).toHaveLength(5);
    expect(overview.cashFlow).toHaveLength(5);
    expect(overview.leadStats).toHaveLength(5);
    expect(overview.orderStats).toHaveLength(5);
    expect(overview.cskhStats).toHaveLength(5);
    expect(Array.isArray(overview.salesRevenue)).toBe(true);
    expect(Array.isArray(overview.marketingRevenue)).toBe(true);
  });

  it("getOverview() tính đúng doanh thu/chi phí/lợi nhuận trong kỳ hiện tại (mới)", async () => {
    const suffix = randomUUID().slice(0, 8);
    const customer = await prisma.customer.create({
      data: { name: "KH Dashboard", phone: `09${suffix}`, customerType: "new" },
    });
    await prisma.order.create({
      data: { customerId: customer.id, status: "confirmed", totalAmount: 1_000_000 },
    });
    await prisma.order.create({
      data: { customerId: customer.id, status: "pending", totalAmount: 5_000_000 }, // pending không tính doanh thu
    });
    const cashAccount = await prisma.cashAccount.create({
      data: { code: `CA-${suffix}`, name: "Quỹ test dashboard", type: "expense", active: true },
    });
    await prisma.cashTransaction.create({
      data: {
        cashAccountId: cashAccount.id,
        type: "expense",
        content: "Chi phí test",
        amount: 300_000,
        transactionDate: new Date(),
      },
    });

    const overview = await service.getOverview("month");
    const current = overview.revenueCostProfit[overview.revenueCostProfit.length - 1];

    expect(current.revenue).toBeGreaterThanOrEqual(1_000_000);
    expect(current.cost).toBeGreaterThanOrEqual(300_000);
    expect(current.profit).toBe(current.revenue - current.cost);
    // cost phải luôn khớp đúng expense trong cashFlow của cùng kỳ (dùng lại 1 kết quả, không hỏi DB 2 lần)
    const currentCashFlow = overview.cashFlow[overview.cashFlow.length - 1];
    expect(current.cost).toBe(currentCashFlow.expense);
  });

  it("getOverview() tính doanh thu Marketing gắn với Lead theo Lead.sourcedBy (mới)", async () => {
    const suffix = randomUUID().slice(0, 8);
    const mkt = await prisma.employee.create({
      data: { name: "MKT Dashboard Test", email: `mkt-dash-${suffix}@test.local`, role: "MKT", status: "active" },
    });
    const lead = await prisma.lead.create({
      data: {
        name: "Lead Dashboard",
        phone: `09${suffix}`,
        source: "Facebook Ads",
        sourcedBy: mkt.id,
        status: "converted",
      },
    });
    const customer = await prisma.customer.create({
      data: { name: "KH Từ Lead Dashboard", phone: `08${suffix}`, customerType: "new" },
    });
    await prisma.order.create({
      data: { customerId: customer.id, leadId: lead.id, status: "delivered", totalAmount: 2_000_000 },
    });

    const overview = await service.getOverview("month");
    const mktSeries = overview.marketingRevenue.find((s) => s.employeeId === mkt.id);

    expect(mktSeries).toBeDefined();
    expect(mktSeries!.values[mktSeries!.values.length - 1]).toBeGreaterThanOrEqual(2_000_000);
  });

  it("getOverview() gộp nhân sự vượt quá giới hạn vào 'Khác' để biểu đồ không quá tải series", async () => {
    const suffix = randomUUID().slice(0, 8);
    for (let i = 0; i < 8; i++) {
      await prisma.employee.create({
        data: { name: `Sale Dash ${suffix}-${i}`, email: `sale-dash-${suffix}-${i}@test.local`, role: "Sale", status: "active" },
      });
    }

    const overview = await service.getOverview("month");
    expect(overview.salesRevenue.length).toBeLessThanOrEqual(6);
    expect(overview.salesRevenue.some((s) => s.employeeName === "Khác")).toBe(true);
  });
});
