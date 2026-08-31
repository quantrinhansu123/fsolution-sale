import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { Account } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { JwtPayload } from "../../common/types/jwt-payload";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {}

  async validateAccount(username: string, password: string): Promise<Account> {
    const account = await this.prisma.account.findUnique({ where: { username } });
    if (!account) throw new UnauthorizedException("Sai tài khoản hoặc mật khẩu");

    const matches = await bcrypt.compare(password, account.passwordHash);
    if (!matches) throw new UnauthorizedException("Sai tài khoản hoặc mật khẩu");

    return account;
  }

  issueToken(account: Account) {
    const payload: JwtPayload = { sub: account.id, username: account.username, isAdmin: account.isAdmin };
    return {
      accessToken: this.jwtService.sign(payload),
      account: this.toProfile(account),
    };
  }

  async getProfile(accountId: string) {
    // Token có thể còn hạn (8h) dù tài khoản đã bị admin xoá trong lúc đó -> 401 rõ ràng
    // thay vì để lỗi Prisma "not found" rơi xuống AllExceptionsFilter thành 500.
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      include: { permissions: true },
    });
    if (!account) throw new UnauthorizedException("Tài khoản không còn tồn tại");
    return this.toProfile(account, account.permissions);
  }

  async changePassword(accountId: string, oldPassword: string, newPassword: string): Promise<void> {
    const account = await this.prisma.account.findUnique({ where: { id: accountId } });
    if (!account) throw new UnauthorizedException("Tài khoản không còn tồn tại");

    const matches = await bcrypt.compare(oldPassword, account.passwordHash);
    if (!matches) throw new UnauthorizedException("Mật khẩu cũ không đúng");

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.account.update({ where: { id: accountId }, data: { passwordHash } });
  }

  private toProfile(
    account: Account,
    permissions?: { module: string; canView: boolean; canEdit: boolean; canDelete: boolean }[]
  ) {
    return {
      id: account.id,
      username: account.username,
      isAdmin: account.isAdmin,
      createdAt: account.createdAt,
      permissions: permissions?.map(({ module, canView, canEdit, canDelete }) => ({
        module,
        canView,
        canEdit,
        canDelete,
      })),
    };
  }
}
