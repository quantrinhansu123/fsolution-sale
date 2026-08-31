import { Injectable } from "@nestjs/common";
import { SaleReport } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateSaleReportDto } from "./dto/create-sale-report.dto";

// Mới (Phase 3) — trạng thái Order tính là "Đã xác nhận" trở lên (không tính pending/cancelled)
const CONFIRMED_STATUSES = ["confirmed", "shipped", "delivered"];
// Giờ Việt Nam (+07:00) — toàn bộ nghiệp vụ trong dự án này chạy theo múi giờ VN.
const TZ_OFFSET = "+07:00";

export interface SaleReportAuto {
  date: string;
  employeeId: string;
  employeeName: string;
  newLeadsAssigned: number;
  leadsToContacted: number;
  leadsToQualified: number;
  leadsToConverted: number;
  leadsToLost: number;
  orderCount: number;
  productsSold: number;
  revenueTotal: number;
  revenueConfirmed: number;
  newCustomers: number;
  returningCustomers: number;
}

@Injectable()
export class SaleReportsService {
  constructor(private readonly prisma: PrismaService) {}

  list(): Promise<SaleReport[]> {
    return this.prisma.saleReport.findMany();
  }

  create(dto: CreateSaleReportDto): Promise<SaleReport> {
    return this.prisma.saleReport.create({ data: { ...dto, date: new Date(dto.date) } });
  }

  // Mới (Phase 3) — read-model tính real-time từ Lead/LeadLog/Order/OrderItem/Customer, không lưu
  // DB (thay thế luồng nhập tay), xem docs/implementation_plan.md mục "Công thức tính SaleReportAuto".
  // Mới — nhận thêm toDate tuỳ chọn để gộp số liệu theo khoảng ngày (mặc định = date, tức 1 ngày).
  async getAuto(date: string, toDate?: string): Promise<SaleReportAuto[]> {
    const start = new Date(`${date}T00:00:00${TZ_OFFSET}`);
    const endBase = new Date(`${toDate ?? date}T00:00:00${TZ_OFFSET}`);
    const end = new Date(endBase.getTime() + 24 * 60 * 60 * 1000);
    const createdAt = { gte: start, lt: end };

    const sales = await this.prisma.employee.findMany({
      where: { role: "Sale", status: "active" },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });

    return Promise.all(
      sales.map(async (employee): Promise<SaleReportAuto> => {
        const [
          newLeadsAssigned,
          leadsToContacted,
          leadsToQualified,
          leadsToConverted,
          leadsToLost,
          orders,
          productsSoldAgg,
        ] = await Promise.all([
          this.prisma.lead.count({ where: { assignedTo: employee.id, createdAt } }),
          this.prisma.leadLog.count({ where: { toStatus: "contacted", createdAt, lead: { assignedTo: employee.id } } }),
          this.prisma.leadLog.count({ where: { toStatus: "qualified", createdAt, lead: { assignedTo: employee.id } } }),
          this.prisma.leadLog.count({ where: { toStatus: "converted", createdAt, lead: { assignedTo: employee.id } } }),
          this.prisma.leadLog.count({ where: { toStatus: "lost", createdAt, lead: { assignedTo: employee.id } } }),
          this.prisma.order.findMany({ where: { assignedTo: employee.id, createdAt }, select: { customerId: true, totalAmount: true, status: true } }),
          this.prisma.orderItem.aggregate({
            _sum: { quantity: true },
            where: { order: { assignedTo: employee.id, createdAt } },
          }),
        ]);

        const revenueTotal = orders.reduce((sum, o) => sum + o.totalAmount, 0);
        const revenueConfirmed = orders
          .filter((o) => CONFIRMED_STATUSES.includes(o.status))
          .reduce((sum, o) => sum + o.totalAmount, 0);

        const customerIds = [...new Set(orders.map((o) => o.customerId))];
        const customers = customerIds.length
          ? await this.prisma.customer.findMany({ where: { id: { in: customerIds } }, select: { customerType: true } })
          : [];
        const newCustomers = customers.filter((c) => c.customerType === "new").length;
        const returningCustomers = customers.filter((c) => c.customerType === "old").length;

        return {
          date,
          employeeId: employee.id,
          employeeName: employee.name,
          newLeadsAssigned,
          leadsToContacted,
          leadsToQualified,
          leadsToConverted,
          leadsToLost,
          orderCount: orders.length,
          productsSold: productsSoldAgg._sum.quantity ?? 0,
          revenueTotal,
          revenueConfirmed,
          newCustomers,
          returningCustomers,
        };
      })
    );
  }
}
