import { Injectable } from "@nestjs/common";
import { AuditLog, Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

export interface RecordAuditLogParams {
  tableName: string;
  recordId: string;
  fieldChanged?: string;
  oldValue?: string;
  newValue?: string;
  changedBy?: string;
}

@Injectable()
export class AuditLogsService {
  constructor(private readonly prisma: PrismaService) {}

  list(): Promise<AuditLog[]> {
    return this.prisma.auditLog.findMany({ orderBy: { createdAt: "desc" } });
  }

  // Nhận tx tuỳ chọn để ghi log trong CÙNG transaction với thay đổi dữ liệu — tránh trường hợp
  // update commit thành công nhưng ghi log thất bại riêng lẻ (vi phạm nguyên tắc #5 âm thầm).
  async record(params: RecordAuditLogParams, tx?: Prisma.TransactionClient): Promise<void> {
    await (tx ?? this.prisma).auditLog.create({ data: params });
  }
}
