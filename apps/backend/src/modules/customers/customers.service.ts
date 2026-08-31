import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, Customer } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { diffFields } from "../../common/utils/audit-diff";
import { CreateCustomerDto } from "./dto/create-customer.dto";
import { UpdateCustomerDto } from "./dto/update-customer.dto";

function isUniqueConstraintError(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
}

@Injectable()
export class CustomersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService
  ) {}

  list(): Promise<Customer[]> {
    return this.prisma.customer.findMany();
  }

  async create(dto: CreateCustomerDto): Promise<Customer> {
    try {
      return await this.prisma.customer.create({ data: dto });
    } catch (err) {
      if (isUniqueConstraintError(err)) throw new ConflictException("Số điện thoại đã tồn tại");
      throw err;
    }
  }

  async update(id: string, dto: UpdateCustomerDto, changedBy?: string): Promise<Customer> {
    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (!customer) throw new NotFoundException("Không tìm thấy khách hàng");

    // Mới (Phase 3) — nguyên tắc #5: mọi thay đổi phải có log, cùng transaction với update.
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.customer.update({ where: { id }, data: dto });

      for (const change of diffFields(customer, dto as unknown as Record<string, unknown>)) {
        await this.auditLogsService.record(
          { tableName: "Customer", recordId: id, fieldChanged: change.field, oldValue: change.oldValue, newValue: change.newValue, changedBy },
          tx
        );
      }

      return updated;
    });
  }
}
