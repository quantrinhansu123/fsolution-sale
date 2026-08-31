import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Order, OrderItem, Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { CreateOrderDto } from "./dto/create-order.dto";
import { UpdateOrderDto } from "./dto/update-order.dto";
import { CreateOrderItemDto } from "./dto/create-order-item.dto";
import { JwtPayload } from "../../common/types/jwt-payload";

// Nguyên tắc #6 (implementation_plan.md): Sale được sửa tự do, sau khi giao hàng/huỷ thì KHOÁ.
const LOCKED_STATUSES = ["delivered", "cancelled"];

export interface OrderListFilters {
  assignedTo?: string;
}

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService
  ) {}

  // Mới (Phase 3): nếu tài khoản đăng nhập link Employee role=Sale (không phải admin), chỉ trả về
  // Order của chính Sale đó; nhúng kèm items[] để FE không phải gọi thêm request phụ.
  // BẢO MẬT: một khi tài khoản bị xác định là Sale bị giới hạn, `assignedTo` LUÔN bị ép về đúng
  // chính họ — KHÔNG đọc `filters.assignedTo` trong nhánh này (cùng lỗi/cùng sửa như LeadsService,
  // xem Conversation.md).
  async list(currentAccount?: JwtPayload, filters: OrderListFilters = {}) {
    const where: Prisma.OrderWhereInput = {};

    const restrictedToEmployeeId = await this.resolveSaleRestriction(currentAccount);
    if (restrictedToEmployeeId) {
      where.assignedTo = restrictedToEmployeeId;
    } else if (filters.assignedTo === "me") {
      const employee = currentAccount && (await this.findEmployeeByAccountId(currentAccount.sub));
      if (employee) where.assignedTo = employee.id;
    } else if (filters.assignedTo) {
      where.assignedTo = filters.assignedTo;
    }

    const orders = await this.prisma.order.findMany({ where, include: { items: true } });

    // Mới — sao chép tên Khách hàng/Sale phụ trách/mã Lead vào response (cùng cách AccountsService
    // làm với employeeName): tài khoản Sale bị giới hạn không có quyền GET /customers, /employees
    // riêng lẻ, nên FE không tự resolve tên được nếu thiếu các field này.
    const customerNames = await this.findCustomerNamesByIds(orders.map((o) => o.customerId));
    const assignedToIds = orders.map((o) => o.assignedTo).filter((id): id is string => !!id);
    const employeeNames = await this.findEmployeeNamesByIds(assignedToIds);
    const leadIds = orders.map((o) => o.leadId).filter((id): id is string => !!id);
    const leadCodes = await this.findLeadCodesByIds(leadIds);

    return orders.map((order) => ({
      ...order,
      customerName: customerNames.get(order.customerId) ?? null,
      assignedToName: order.assignedTo ? employeeNames.get(order.assignedTo) ?? null : null,
      leadCode: order.leadId ? leadCodes.get(order.leadId) ?? null : null,
    }));
  }

  private async findLeadCodesByIds(ids: string[]): Promise<Map<string, string>> {
    if (ids.length === 0) return new Map();
    const leads = await this.prisma.lead.findMany({
      where: { id: { in: ids } },
      select: { id: true, code: true },
    });
    return new Map(leads.filter((l) => l.code).map((l) => [l.id, l.code as string]));
  }

  private async findCustomerNamesByIds(ids: string[]): Promise<Map<string, string>> {
    if (ids.length === 0) return new Map();
    const customers = await this.prisma.customer.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true },
    });
    return new Map(customers.map((c) => [c.id, c.name]));
  }

  private async findEmployeeNamesByIds(ids: string[]): Promise<Map<string, string>> {
    if (ids.length === 0) return new Map();
    const employees = await this.prisma.employee.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true },
    });
    return new Map(employees.map((e) => [e.id, e.name]));
  }

  private async resolveSaleRestriction(currentAccount?: JwtPayload): Promise<string | null> {
    if (!currentAccount || currentAccount.isAdmin) return null;
    const employee = await this.findEmployeeByAccountId(currentAccount.sub);
    return employee?.role === "Sale" ? employee.id : null;
  }

  // Mới (Phase 3): nhận customerName/shippingPhone thay vì chỉ customerId — tự upsert Customer
  // theo phone (chưa có → customerType=new; đã có → customerType=old), tạo kèm 1 OrderItem đầu
  // tiên nếu có đủ thông tin sản phẩm. customerId (cũ) vẫn nhận để tương thích ngược.
  async create(dto: CreateOrderDto, currentAccount?: JwtPayload): Promise<Order> {
    let assignedTo = dto.assignedTo;
    const restrictedToEmployeeId = await this.resolveSaleRestriction(currentAccount);
    if (!assignedTo && currentAccount) {
      const employee = await this.findEmployeeByAccountId(currentAccount.sub);
      if (employee?.role === "Sale") assignedTo = employee.id;
    }

    // Khớp đúng contract (api-contract.openapi.yaml): chỉ nhận Lead status=converted, và nếu
    // người gọi là Sale bị giới hạn thì Lead đó phải đang thuộc chính Sale đó.
    if (dto.leadId) {
      const lead = await this.prisma.lead.findUnique({ where: { id: dto.leadId } });
      if (!lead) throw new BadRequestException("Không tìm thấy Lead");
      if (lead.status !== "converted") {
        throw new BadRequestException("Chỉ được chọn Lead ở trạng thái \"Đã chốt\" (converted)");
      }
      if (restrictedToEmployeeId && lead.assignedTo !== restrictedToEmployeeId) {
        throw new BadRequestException("Lead này không thuộc Sale đang tạo đơn");
      }
    }

    return this.prisma.$transaction(async (tx) => {
      let customerId = dto.customerId;

      // Chỉ tự upsert Customer theo shippingPhone khi KHÔNG được truyền thẳng customerId — tránh
      // âm thầm ghi đè customerId đã chọn tường minh (finding thật bắt được lúc /review).
      if (!customerId && dto.shippingPhone) {
        const existing = await tx.customer.findUnique({ where: { phone: dto.shippingPhone } });
        const customer = existing
          ? await tx.customer.update({
              where: { id: existing.id },
              data: {
                customerType: "old",
                ...(dto.customerName ? { name: dto.customerName } : {}),
                ...(dto.shippingAddress ? { address: dto.shippingAddress } : {}),
              },
            })
          : await tx.customer.create({
              data: {
                name: dto.customerName ?? "Khách chưa rõ tên",
                phone: dto.shippingPhone,
                address: dto.shippingAddress,
                customerType: "new",
              },
            });
        customerId = customer.id;
      }

      if (!customerId) {
        throw new BadRequestException("Cần truyền customerId hoặc customerName + shippingPhone");
      }

      const hasItem =
        dto.productId !== undefined &&
        dto.productName !== undefined &&
        dto.quantity !== undefined &&
        dto.unitPrice !== undefined;

      return tx.order.create({
        data: {
          customerId,
          leadId: dto.leadId,
          assignedTo,
          shippingAddress: dto.shippingAddress,
          shippingPhone: dto.shippingPhone,
          note: dto.note,
          totalAmount: dto.totalAmount,
          ...(hasItem
            ? {
                items: {
                  create: [
                    {
                      productId: dto.productId!,
                      productName: dto.productName!,
                      unit: dto.unit,
                      quantity: dto.quantity!,
                      unitPrice: dto.unitPrice!,
                      discountPercent: dto.discountPercent,
                    },
                  ],
                },
              }
            : {}),
        },
        include: { items: true },
      });
    });
  }

  async update(id: string, dto: UpdateOrderDto, changedBy?: string): Promise<Order> {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException("Không tìm thấy hợp đồng");
    if (LOCKED_STATUSES.includes(order.status)) {
      throw new ConflictException(`Hợp đồng đã ở trạng thái "${order.status}", không thể sửa`);
    }

    // Nguyên tắc #5 (implementation_plan.md): update + ghi log phải cùng transaction, tránh
    // trường hợp update commit thành công nhưng ghi log thất bại riêng lẻ.
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({ where: { id }, data: dto });

      if (dto.status && dto.status !== order.status) {
        await this.auditLogsService.record(
          {
            tableName: "Order",
            recordId: id,
            fieldChanged: "status",
            oldValue: order.status,
            newValue: dto.status,
            changedBy,
          },
          tx
        );
      }

      return updated;
    });
  }

  async getItems(orderId: string): Promise<OrderItem[]> {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException("Không tìm thấy hợp đồng");

    return this.prisma.orderItem.findMany({ where: { orderId }, orderBy: { createdAt: "asc" } });
  }

  async addItem(orderId: string, dto: CreateOrderItemDto): Promise<OrderItem> {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException("Không tìm thấy hợp đồng");
    if (LOCKED_STATUSES.includes(order.status)) {
      throw new ConflictException(`Hợp đồng đã ở trạng thái "${order.status}", không thể sửa`);
    }

    return this.prisma.orderItem.create({ data: { orderId, ...dto } });
  }

  private findEmployeeByAccountId(accountId: string) {
    return this.prisma.employee.findUnique({ where: { accountId } });
  }
}
