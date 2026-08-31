import { Injectable, NotFoundException, OnModuleInit } from "@nestjs/common";
import { SystemConfig } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { UpdateSystemConfigDto } from "./dto/update-system-config.dto";

// Không có endpoint tạo qua API công khai (contract chỉ có GET + PATCH theo key) — bootstrap giá trị
// mặc định 1 lần khi khởi động, idempotent (upsert, không ghi đè nếu Admin đã sửa qua PATCH).
const DEFAULT_CONFIGS: Array<{ key: string; value: string; description: string }> = [
  { key: "exchange_rate_usd", value: "24000", description: "Tỷ giá USD/VND" },
  { key: "low_stock_threshold", value: "10", description: "Ngưỡng cảnh báo tồn kho thấp" },
];

@Injectable()
export class SystemConfigService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService
  ) {}

  async onModuleInit(): Promise<void> {
    for (const config of DEFAULT_CONFIGS) {
      await this.prisma.systemConfig.upsert({
        where: { key: config.key },
        update: {},
        create: config,
      });
    }
  }

  list(): Promise<SystemConfig[]> {
    return this.prisma.systemConfig.findMany();
  }

  async update(key: string, dto: UpdateSystemConfigDto, changedBy?: string): Promise<SystemConfig> {
    const config = await this.prisma.systemConfig.findUnique({ where: { key } });
    if (!config) throw new NotFoundException("Không tìm thấy cấu hình");

    // Nguyên tắc #5 (implementation_plan.md): cấu hình hệ thống ảnh hưởng tính toán toàn hệ
    // thống (tỷ giá, ngưỡng cảnh báo) — mọi thay đổi phải có log, cùng transaction với update.
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.systemConfig.update({ where: { key }, data: dto });

      if (dto.value !== config.value) {
        await this.auditLogsService.record(
          {
            tableName: "SystemConfig",
            recordId: config.id,
            fieldChanged: "value",
            oldValue: config.value,
            newValue: dto.value,
            changedBy,
          },
          tx
        );
      }

      return updated;
    });
  }
}
