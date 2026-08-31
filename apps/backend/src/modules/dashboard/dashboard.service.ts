import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { DashboardPeriodType, getPeriodRanges, PeriodRange, utcDateBoundary } from "./period-range";

const PERIOD_COUNT = 5;
// Nguyên tắc: doanh thu chỉ tính đơn đã "chắc chắn" (không tính pending/cancelled) — khớp
// CONFIRMED_STATUSES ở SaleReportsService.
const CONFIRMED_STATUSES = ["confirmed", "shipped", "delivered"];
const LEAD_STATUSES = ["new", "contacted", "qualified", "converted", "lost"];
const ORDER_STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"];
const CSKH_STATUSES = ["called", "upsell", "cross_sell", "no_answer"];
// Số nhân sự tối đa hiển thị riêng theo tên trên biểu đồ — vượt quá thì gộp phần còn lại vào "Khác"
// (bảng màu categorical chỉ an toàn phân biệt đến ~8 nhóm, xem skill dataviz).
const MAX_EMPLOYEE_SERIES = 6;

export interface EmployeeSeries {
  employeeId: string | null;
  employeeName: string;
  values: number[];
}

export interface DashboardOverview {
  periods: string[];
  revenueCostProfit: { period: string; revenue: number; cost: number; profit: number }[];
  salesRevenue: EmployeeSeries[];
  marketingRevenue: EmployeeSeries[];
  leadStats: { period: string; total: number; byStatus: Record<string, number> }[];
  orderStats: { period: string; total: number; byStatus: Record<string, number> }[];
  cskhStats: { period: string; total: number; byStatus: Record<string, number> }[];
  cashFlow: { period: string; income: number; expense: number }[];
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(period: DashboardPeriodType): Promise<DashboardOverview> {
    const ranges = getPeriodRanges(period, PERIOD_COUNT);
    const periods = ranges.map((r) => r.label);

    const [revenueByPeriod, cashFlow, leadStats, orderStats, cskhStats, salesRevenue, marketingRevenue] =
      await Promise.all([
        this.getConfirmedRevenue(ranges),
        this.getCashFlow(ranges),
        this.getLeadStats(ranges),
        this.getOrderStats(ranges),
        this.getCskhStats(ranges),
        this.getSalesRevenueSeries(ranges),
        this.getMarketingRevenueSeries(ranges),
      ]);

    // cost dùng lại đúng "expense" đã tính trong cashFlow — tránh hỏi DB cùng 1 câu 2 lần.
    const revenueCostProfit = ranges.map((r, i) => {
      const revenue = revenueByPeriod[i];
      const cost = cashFlow[i].expense;
      return { period: r.label, revenue, cost, profit: revenue - cost };
    });

    return { periods, revenueCostProfit, salesRevenue, marketingRevenue, leadStats, orderStats, cskhStats, cashFlow };
  }

  private async getConfirmedRevenue(ranges: PeriodRange[]): Promise<number[]> {
    return Promise.all(
      ranges.map(async (r) => {
        const agg = await this.prisma.order.aggregate({
          _sum: { totalAmount: true },
          where: { status: { in: CONFIRMED_STATUSES }, createdAt: { gte: r.start, lt: r.end } },
        });
        return agg._sum.totalAmount ?? 0;
      })
    );
  }

  private async getCashFlow(ranges: PeriodRange[]) {
    return Promise.all(
      ranges.map(async (r) => {
        // `CashTransaction.transactionDate` là `@db.Date` (không giờ/múi giờ) — phải so với
        // biên nửa đêm UTC của đúng ngày lịch, KHÔNG dùng r.start/r.end (nửa đêm giờ VN =
        // 17:00Z hôm trước, bị Prisma cắt giờ làm lệch nguyên 1 ngày, bỏ sót giao dịch ngày cuối kỳ).
        const dateFilter = { gte: utcDateBoundary(r.startDate), lt: utcDateBoundary(r.endDate) };
        const [incomeAgg, expenseAgg] = await Promise.all([
          this.prisma.cashTransaction.aggregate({
            _sum: { amount: true },
            where: { type: "income", transactionDate: dateFilter },
          }),
          this.prisma.cashTransaction.aggregate({
            _sum: { amount: true },
            where: { type: "expense", transactionDate: dateFilter },
          }),
        ]);
        return { period: r.label, income: incomeAgg._sum.amount ?? 0, expense: expenseAgg._sum.amount ?? 0 };
      })
    );
  }

  private async getLeadStats(ranges: PeriodRange[]) {
    return Promise.all(
      ranges.map(async (r) => {
        const grouped = await this.prisma.lead.groupBy({
          by: ["status"],
          _count: { _all: true },
          where: { createdAt: { gte: r.start, lt: r.end } },
        });
        return { period: r.label, ...this.toCountsByStatus(grouped, LEAD_STATUSES) };
      })
    );
  }

  private async getOrderStats(ranges: PeriodRange[]) {
    return Promise.all(
      ranges.map(async (r) => {
        const grouped = await this.prisma.order.groupBy({
          by: ["status"],
          _count: { _all: true },
          where: { createdAt: { gte: r.start, lt: r.end } },
        });
        return { period: r.label, ...this.toCountsByStatus(grouped, ORDER_STATUSES) };
      })
    );
  }

  private async getCskhStats(ranges: PeriodRange[]) {
    return Promise.all(
      ranges.map(async (r) => {
        const grouped = await this.prisma.cskhLog.groupBy({
          by: ["status"],
          _count: { _all: true },
          where: { createdAt: { gte: r.start, lt: r.end } },
        });
        return { period: r.label, ...this.toCountsByStatus(grouped, CSKH_STATUSES) };
      })
    );
  }

  private toCountsByStatus(
    grouped: { status: string; _count: { _all: number } }[],
    knownStatuses: string[]
  ): { total: number; byStatus: Record<string, number> } {
    const byStatus: Record<string, number> = Object.fromEntries(knownStatuses.map((s) => [s, 0]));
    let total = 0;
    for (const g of grouped) {
      byStatus[g.status] = (byStatus[g.status] ?? 0) + g._count._all;
      total += g._count._all;
    }
    return { total, byStatus };
  }

  private async getSalesRevenueSeries(ranges: PeriodRange[]): Promise<EmployeeSeries[]> {
    const sales = await this.prisma.employee.findMany({
      where: { role: "Sale", status: "active" },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });
    const series = await Promise.all(
      sales.map(async (emp): Promise<EmployeeSeries> => {
        const values = await Promise.all(
          ranges.map(async (r) => {
            const agg = await this.prisma.order.aggregate({
              _sum: { totalAmount: true },
              where: {
                assignedTo: emp.id,
                status: { in: CONFIRMED_STATUSES },
                createdAt: { gte: r.start, lt: r.end },
              },
            });
            return agg._sum.totalAmount ?? 0;
          })
        );
        return { employeeId: emp.id, employeeName: emp.name, values };
      })
    );
    return this.foldToTopN(series, ranges.length);
  }

  // Mới — doanh thu Marketing gắn với Lead: Order.leadId là tham chiếu lỏng (không có Prisma
  // relation), nên phải tự tra Lead theo sourcedBy trước rồi mới lọc Order theo leadId.
  private async getMarketingRevenueSeries(ranges: PeriodRange[]): Promise<EmployeeSeries[]> {
    const mktEmployees = await this.prisma.employee.findMany({
      where: { role: "MKT", status: "active" },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });
    if (mktEmployees.length === 0) return [];

    const leads = await this.prisma.lead.findMany({
      where: { sourcedBy: { in: mktEmployees.map((e) => e.id) } },
      select: { id: true, sourcedBy: true },
    });
    const leadIdsByEmployee = new Map<string, string[]>();
    for (const lead of leads) {
      if (!lead.sourcedBy) continue;
      const arr = leadIdsByEmployee.get(lead.sourcedBy) ?? [];
      arr.push(lead.id);
      leadIdsByEmployee.set(lead.sourcedBy, arr);
    }

    const series = await Promise.all(
      mktEmployees.map(async (emp): Promise<EmployeeSeries> => {
        const leadIds = leadIdsByEmployee.get(emp.id) ?? [];
        const values = await Promise.all(
          ranges.map(async (r) => {
            if (leadIds.length === 0) return 0;
            const agg = await this.prisma.order.aggregate({
              _sum: { totalAmount: true },
              where: { leadId: { in: leadIds }, status: { in: CONFIRMED_STATUSES }, createdAt: { gte: r.start, lt: r.end } },
            });
            return agg._sum.totalAmount ?? 0;
          })
        );
        return { employeeId: emp.id, employeeName: emp.name, values };
      })
    );
    return this.foldToTopN(series, ranges.length);
  }

  private foldToTopN(series: EmployeeSeries[], periodsCount: number): EmployeeSeries[] {
    if (series.length <= MAX_EMPLOYEE_SERIES) return series;

    const withTotal = series.map((s) => ({ ...s, total: s.values.reduce((a, b) => a + b, 0) }));
    withTotal.sort((a, b) => b.total - a.total);

    const top = withTotal.slice(0, MAX_EMPLOYEE_SERIES - 1).map(({ total: _total, ...rest }) => rest);
    const rest = withTotal.slice(MAX_EMPLOYEE_SERIES - 1);
    const otherValues = Array.from({ length: periodsCount }, (_, i) => rest.reduce((sum, s) => sum + s.values[i], 0));

    return [...top, { employeeId: null, employeeName: "Khác", values: otherValues }];
  }
}
