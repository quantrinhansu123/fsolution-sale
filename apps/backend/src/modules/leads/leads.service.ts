import { Injectable, NotFoundException } from "@nestjs/common";
import { Lead, LeadLog, Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { CreateLeadDto } from "./dto/create-lead.dto";
import { UpdateLeadDto } from "./dto/update-lead.dto";
import { JwtPayload } from "../../common/types/jwt-payload";

const CODE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export interface LeadListFilters {
  status?: string;
  assignedTo?: string;
}

@Injectable()
export class LeadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService
  ) {}

  // Mới (Phase 3): nếu tài khoản đăng nhập link Employee role=Sale (không phải admin), chỉ trả về
  // Lead của chính Sale đó (theo assignedTo); role=MKT chỉ trả về Lead do chính mình nguồn (theo
  // sourcedBy) — tài khoản khác (admin/module mặc định) giữ nguyên thấy toàn bộ.
  // BẢO MẬT: một khi tài khoản bị xác định thuộc diện bị giới hạn, field lọc (assignedTo/sourcedBy)
  // LUÔN bị ép về đúng chính họ — KHÔNG được đọc `filters.assignedTo` trong nhánh này, để query
  // param không thể ghi đè và lộ dữ liệu của Sale/MKT khác (đã tự phát hiện qua exploit thật lúc
  // /review, xem Conversation.md).
  async list(currentAccount?: JwtPayload, filters: LeadListFilters = {}): Promise<Lead[]> {
    const where: Prisma.LeadWhereInput = {};
    if (filters.status) where.status = filters.status;

    const restriction = await this.resolveRowRestriction(currentAccount);
    if (restriction) {
      where[restriction.field] = restriction.employeeId;
    } else if (filters.assignedTo === "me") {
      const employee = currentAccount && (await this.findEmployeeByAccountId(currentAccount.sub));
      if (employee) where.assignedTo = employee.id;
    } else if (filters.assignedTo) {
      where.assignedTo = filters.assignedTo;
    }

    return this.prisma.lead.findMany({ where });
  }

  // Trả về field cần ép + employeeId nếu tài khoản này PHẢI bị giới hạn (link Employee role=Sale
  // hoặc role=MKT, không phải admin); null nếu tài khoản được thấy toàn bộ (admin, không link
  // Employee, hoặc role khác).
  private async resolveRowRestriction(
    currentAccount?: JwtPayload
  ): Promise<{ field: "assignedTo" | "sourcedBy"; employeeId: string } | null> {
    if (!currentAccount || currentAccount.isAdmin) return null;
    const employee = await this.findEmployeeByAccountId(currentAccount.sub);
    if (!employee) return null;
    if (employee.role === "Sale") return { field: "assignedTo", employeeId: employee.id };
    if (employee.role === "MKT") return { field: "sourcedBy", employeeId: employee.id };
    return null;
  }

  async create(dto: CreateLeadDto): Promise<Lead> {
    const code = await this.generateUniqueCode();
    const assignedTo = await this.pickRoundRobinByRole("Sale");
    const sourcedBy = dto.sourcedBy ?? (await this.pickRoundRobinByRole("MKT"));
    return this.prisma.lead.create({ data: { ...dto, code, assignedTo, sourcedBy } });
  }

  async update(id: string, dto: UpdateLeadDto, changedBy?: string): Promise<Lead> {
    const lead = await this.prisma.lead.findUnique({ where: { id } });
    if (!lead) throw new NotFoundException("Không tìm thấy lead");

    const statusChanged = dto.status !== undefined && dto.status !== lead.status;
    const assignedToChanged = dto.assignedTo !== undefined && dto.assignedTo !== lead.assignedTo;

    // Nguyên tắc #5 (implementation_plan.md): update + ghi log phải cùng transaction.
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.lead.update({
        where: { id },
        data: {
          ...(dto.status !== undefined ? { status: dto.status } : {}),
          ...(dto.assignedTo !== undefined ? { assignedTo: dto.assignedTo } : {}),
        },
      });

      if (statusChanged) {
        await tx.leadLog.create({
          data: {
            leadId: id,
            fromStatus: lead.status,
            toStatus: dto.status,
            fieldChanged: "status",
            note: dto.note,
            changedBy,
          },
        });
        await this.auditLogsService.record(
          {
            tableName: "Lead",
            recordId: id,
            fieldChanged: "status",
            oldValue: lead.status,
            newValue: dto.status,
            changedBy,
          },
          tx
        );
      }

      // Mới (Phase 3): trước đây đổi assignedTo không ghi log ở đâu cả — sửa đúng lỗi đã báo.
      if (assignedToChanged) {
        await tx.leadLog.create({
          data: {
            leadId: id,
            fromStatus: lead.status,
            toStatus: null,
            fieldChanged: "assignedTo",
            oldValue: lead.assignedTo,
            newValue: dto.assignedTo,
            note: dto.note,
            changedBy,
          },
        });
        await this.auditLogsService.record(
          {
            tableName: "Lead",
            recordId: id,
            fieldChanged: "assignedTo",
            oldValue: lead.assignedTo ?? undefined,
            newValue: dto.assignedTo ?? undefined,
            changedBy,
          },
          tx
        );
      }

      return updated;
    });
  }

  async getLogs(id: string): Promise<LeadLog[]> {
    const lead = await this.prisma.lead.findUnique({ where: { id } });
    if (!lead) throw new NotFoundException("Không tìm thấy lead");

    return this.prisma.leadLog.findMany({ where: { leadId: id }, orderBy: { createdAt: "asc" } });
  }

  private findEmployeeByAccountId(accountId: string) {
    return this.prisma.employee.findUnique({ where: { accountId } });
  }

  private randomCode(): string {
    let code = "";
    for (let i = 0; i < 4; i++) {
      code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
    }
    return code;
  }

  private async generateUniqueCode(): Promise<string> {
    for (let attempt = 0; attempt < 10; attempt++) {
      const code = this.randomCode();
      const existing = await this.prisma.lead.findUnique({ where: { code } });
      if (!existing) return code;
    }
    throw new Error("Không sinh được mã Lead duy nhất sau 10 lần thử");
  }

  // Mới (Phase 3): round-robin stateless — không lưu con trỏ riêng, xem implementation_plan.md
  // mục "Quyết định thiết kế" #2.
  // Dùng chung cho cả round-robin Sale (assignedTo) và MKT (sourcedBy) — chỉ khác role lọc.
  private async pickRoundRobinByRole(role: string): Promise<string | null> {
    const activeEmployees = await this.prisma.employee.findMany({
      where: { role, status: "active" },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });
    if (activeEmployees.length === 0) return null;

    const leadCount = await this.prisma.lead.count();
    return activeEmployees[leadCount % activeEmployees.length].id;
  }
}
