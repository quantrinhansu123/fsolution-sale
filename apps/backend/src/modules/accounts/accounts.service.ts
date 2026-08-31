import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { Account } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { CreateAccountDto } from "./dto/create-account.dto";
import { UpdateAccountDto } from "./dto/update-account.dto";
import { PermissionInputDto } from "./dto/permission-input.dto";

const DEFAULT_PASSWORD = "abc123";

function isUniqueConstraintError(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
}

@Injectable()
export class AccountsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService
  ) {}

  async list() {
    const accounts = await this.prisma.account.findMany({
      include: { permissions: true },
      orderBy: { createdAt: "asc" },
    });
    const employeeNames = await this.findEmployeeNamesByAccountIds(accounts.map((a) => a.id));
    return accounts.map((account) => this.toProfile(account, employeeNames.get(account.id) ?? null));
  }

  async create(dto: CreateAccountDto) {
    const passwordHash = await bcrypt.hash(dto.password ?? DEFAULT_PASSWORD, 10);
    try {
      const account = await this.prisma.account.create({
        data: { username: dto.username, passwordHash, isAdmin: false },
      });
      return this.toProfile(account, null);
    } catch (err) {
      if (isUniqueConstraintError(err)) throw new ConflictException("Tên tài khoản đã tồn tại");
      throw err;
    }
  }

  async update(id: string, dto: UpdateAccountDto, changedBy?: string) {
    const before = await this.findOrThrow(id);

    const data: { username?: string; passwordHash?: string } = {};
    if (dto.username) data.username = dto.username;
    if (dto.newPassword) data.passwordHash = await bcrypt.hash(dto.newPassword, 10);
    else if (dto.resetPassword) data.passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

    try {
      // Mới (Phase 3) — nguyên tắc #5: mọi thay đổi phải có log, cùng transaction với update.
      const account = await this.prisma.$transaction(async (tx) => {
        const updated = await tx.account.update({ where: { id }, data });

        if (dto.username && dto.username !== before.username) {
          await this.auditLogsService.record(
            { tableName: "Account", recordId: id, fieldChanged: "username", oldValue: before.username, newValue: dto.username, changedBy },
            tx
          );
        }
        if (dto.newPassword || dto.resetPassword) {
          await this.auditLogsService.record(
            {
              tableName: "Account",
              recordId: id,
              fieldChanged: "password",
              oldValue: "(ẩn)",
              newValue: dto.newPassword ? "(đã đặt mật khẩu mới)" : "(đã đặt lại mặc định)",
              changedBy,
            },
            tx
          );
        }

        return updated;
      });
      const employeeNames = await this.findEmployeeNamesByAccountIds([id]);
      return this.toProfile(account, employeeNames.get(id) ?? null);
    } catch (err) {
      if (isUniqueConstraintError(err)) throw new ConflictException("Tên tài khoản đã tồn tại");
      throw err;
    }
  }

  async remove(id: string, changedBy?: string): Promise<void> {
    const account = await this.findOrThrow(id);
    if (account.isAdmin) {
      const adminCount = await this.prisma.account.count({ where: { isAdmin: true } });
      if (adminCount <= 1) {
        throw new ConflictException("Không thể xoá tài khoản admin cuối cùng");
      }
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.account.delete({ where: { id } });
      await this.auditLogsService.record(
        { tableName: "Account", recordId: id, fieldChanged: "deleted", oldValue: account.username, changedBy },
        tx
      );
    });
  }

  async getPermissions(accountId: string) {
    await this.findOrThrow(accountId);
    const permissions = await this.prisma.permission.findMany({
      where: { accountId },
      select: { module: true, canView: true, canEdit: true, canDelete: true },
    });
    return permissions;
  }

  async setPermissions(accountId: string, items: PermissionInputDto[], changedBy?: string) {
    await this.findOrThrow(accountId);
    const before = await this.getPermissions(accountId);
    const beforeByModule = new Map(before.map((p) => [p.module, p]));

    await this.prisma.$transaction(async (tx) => {
      for (const item of items) {
        await tx.permission.upsert({
          where: { accountId_module: { accountId, module: item.module } },
          update: { canView: item.canView, canEdit: item.canEdit, canDelete: item.canDelete },
          create: {
            accountId,
            module: item.module,
            canView: item.canView,
            canEdit: item.canEdit,
            canDelete: item.canDelete,
          },
        });

        // Mới (Phase 3) — nguyên tắc #5: đổi ma trận quyền phải có log, cùng transaction.
        // Permission chưa từng tồn tại mặc định là false ở mọi field (khớp default trong schema).
        const prev = beforeByModule.get(item.module);
        for (const field of ["canView", "canEdit", "canDelete"] as const) {
          const prevValue = prev ? prev[field] : false;
          if (prevValue !== item[field]) {
            await this.auditLogsService.record(
              {
                tableName: "Permission",
                recordId: `${accountId}:${item.module}`,
                fieldChanged: field,
                oldValue: String(prevValue),
                newValue: String(item[field]),
                changedBy,
              },
              tx
            );
          }
        }
      }
    });
    return this.getPermissions(accountId);
  }

  private async findOrThrow(id: string): Promise<Account> {
    const account = await this.prisma.account.findUnique({ where: { id } });
    if (!account) throw new NotFoundException("Không tìm thấy tài khoản");
    return account;
  }

  // Mới (Phase 3) — join ngược Employee.accountId, 1 query cho nhiều account (tránh N+1)
  private async findEmployeeNamesByAccountIds(accountIds: string[]): Promise<Map<string, string>> {
    if (accountIds.length === 0) return new Map();
    const employees = await this.prisma.employee.findMany({
      where: { accountId: { in: accountIds } },
      select: { accountId: true, name: true },
    });
    return new Map(employees.filter((e) => e.accountId).map((e) => [e.accountId as string, e.name]));
  }

  private toProfile(
    account: Account & { permissions?: { module: string; canView: boolean; canEdit: boolean; canDelete: boolean }[] },
    employeeName: string | null
  ) {
    return {
      id: account.id,
      username: account.username,
      isAdmin: account.isAdmin,
      employeeName,
      createdAt: account.createdAt,
      permissions: account.permissions?.map(({ module, canView, canEdit, canDelete }) => ({
        module,
        canView,
        canEdit,
        canDelete,
      })),
    };
  }
}
