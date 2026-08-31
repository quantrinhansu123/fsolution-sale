import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PrismaService } from "../../prisma/prisma.service";
import {
  PermissionAction,
  REQUIRE_PERMISSION_KEY,
} from "../decorators/require-permission.decorator";
import { JwtPayload } from "../types/jwt-payload";

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.get<{ module: string; action: PermissionAction } | undefined>(
      REQUIRE_PERMISSION_KEY,
      context.getHandler()
    );
    if (!required) return true;

    const account: JwtPayload | undefined = context.switchToHttp().getRequest().user;
    if (!account) return false;
    if (account.isAdmin) return true;

    const permission = await this.prisma.permission.findUnique({
      where: { accountId_module: { accountId: account.sub, module: required.module } },
    });
    if (!permission) return false;

    if (required.action === "view") return permission.canView;
    if (required.action === "edit") return permission.canEdit;
    return permission.canDelete;
  }
}
