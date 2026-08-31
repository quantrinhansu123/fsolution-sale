import { Injectable } from "@nestjs/common";
import { MarketingReport } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateMarketingReportDto } from "./dto/create-marketing-report.dto";

// Nguyên tắc: doanh thu chỉ tính đơn đã "chắc chắn" — khớp CONFIRMED_STATUSES ở SaleReportsService.
const CONFIRMED_STATUSES = ["confirmed", "shipped", "delivered"];
// Giờ Việt Nam (+07:00) — khớp TZ_OFFSET dùng ở SaleReportsService.
const TZ_OFFSET = "+07:00";

export interface MarketingReportAuto {
  employeeId: string;
  employeeName: string;
  leadCount: number;
  orderCount: number;
  revenue: number;
}

@Injectable()
export class MarketingReportsService {
  constructor(private readonly prisma: PrismaService) {}

  list(): Promise<MarketingReport[]> {
    return this.prisma.marketingReport.findMany();
  }

  create(dto: CreateMarketingReportDto): Promise<MarketingReport> {
    return this.prisma.marketingReport.create({ data: { ...dto, date: new Date(dto.date) } });
  }

  // Mới — Báo cáo tự động Marketing: doanh thu tính real-time bằng cách map Lead.sourcedBy với
  // doanh thu Order gắn Lead đó (khớp cách DashboardService tính marketingRevenue), theo khoảng
  // [date, toDate]. leadCount đếm Lead tạo trong khoảng; revenue/orderCount tính theo Order phát
  // sinh trong khoảng (không phụ thuộc lúc Lead được tạo, vì 1 Lead có thể chốt đơn ở kỳ sau).
  async getAuto(date: string, toDate?: string): Promise<MarketingReportAuto[]> {
    const start = new Date(`${date}T00:00:00${TZ_OFFSET}`);
    const endBase = new Date(`${toDate ?? date}T00:00:00${TZ_OFFSET}`);
    const end = new Date(endBase.getTime() + 24 * 60 * 60 * 1000);
    const createdAt = { gte: start, lt: end };

    const mktEmployees = await this.prisma.employee.findMany({
      where: { role: "MKT", status: "active" },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });

    return Promise.all(
      mktEmployees.map(async (employee): Promise<MarketingReportAuto> => {
        const [leadCount, allLeadsOfEmployee] = await Promise.all([
          this.prisma.lead.count({ where: { sourcedBy: employee.id, createdAt } }),
          this.prisma.lead.findMany({ where: { sourcedBy: employee.id }, select: { id: true } }),
        ]);

        const leadIds = allLeadsOfEmployee.map((l) => l.id);
        if (leadIds.length === 0) {
          return { employeeId: employee.id, employeeName: employee.name, leadCount, orderCount: 0, revenue: 0 };
        }

        const orders = await this.prisma.order.findMany({
          where: { leadId: { in: leadIds }, status: { in: CONFIRMED_STATUSES }, createdAt },
          select: { totalAmount: true },
        });

        return {
          employeeId: employee.id,
          employeeName: employee.name,
          leadCount,
          orderCount: orders.length,
          revenue: orders.reduce((sum, o) => sum + o.totalAmount, 0),
        };
      })
    );
  }
}
