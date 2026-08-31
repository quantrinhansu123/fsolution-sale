import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Payment } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { CreatePaymentDto } from "./dto/create-payment.dto";
import { UpdatePaymentDto } from "./dto/update-payment.dto";

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService
  ) {}

  list(): Promise<Payment[]> {
    return this.prisma.payment.findMany();
  }

  create(dto: CreatePaymentDto): Promise<Payment> {
    return this.prisma.payment.create({ data: dto });
  }

  async update(id: string, dto: UpdatePaymentDto, changedBy?: string): Promise<Payment> {
    const payment = await this.prisma.payment.findUnique({ where: { id } });
    if (!payment) throw new NotFoundException("Không tìm thấy khoản thu");

    // Nguyên tắc #3 (implementation_plan.md): không có bill (đối soát) thì không được set "completed".
    const nextReconciledAt = dto.reconciledAt ?? payment.reconciledAt;
    if (dto.status === "completed" && !nextReconciledAt) {
      throw new BadRequestException('Không thể chuyển sang "completed" khi chưa có bằng chứng đối soát (reconciledAt)');
    }

    const data: Record<string, unknown> = { ...dto };
    if (dto.reconciledAt !== undefined) data.reconciledAt = new Date(dto.reconciledAt);

    // Nguyên tắc #5 (implementation_plan.md): update + ghi log phải cùng transaction.
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.payment.update({ where: { id }, data });

      if (dto.status && dto.status !== payment.status) {
        await this.auditLogsService.record(
          {
            tableName: "Payment",
            recordId: id,
            fieldChanged: "status",
            oldValue: payment.status,
            newValue: dto.status,
            changedBy,
          },
          tx
        );
      }

      return updated;
    });
  }
}
