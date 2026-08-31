import { Injectable, NotFoundException } from "@nestjs/common";
import { Campaign } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { diffFields } from "../../common/utils/audit-diff";
import { CreateCampaignDto } from "./dto/create-campaign.dto";
import { UpdateCampaignDto } from "./dto/update-campaign.dto";

@Injectable()
export class CampaignsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService
  ) {}

  list(): Promise<Campaign[]> {
    return this.prisma.campaign.findMany();
  }

  create(dto: CreateCampaignDto): Promise<Campaign> {
    return this.prisma.campaign.create({ data: dto });
  }

  async update(id: string, dto: UpdateCampaignDto, changedBy?: string): Promise<Campaign> {
    const campaign = await this.prisma.campaign.findUnique({ where: { id } });
    if (!campaign) throw new NotFoundException("Không tìm thấy chiến dịch");

    // Mới (Phase 3) — nguyên tắc #5: mọi thay đổi phải có log, cùng transaction với update.
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.campaign.update({ where: { id }, data: dto });

      for (const change of diffFields(campaign, dto as unknown as Record<string, unknown>)) {
        await this.auditLogsService.record(
          { tableName: "Campaign", recordId: id, fieldChanged: change.field, oldValue: change.oldValue, newValue: change.newValue, changedBy },
          tx
        );
      }

      return updated;
    });
  }
}
