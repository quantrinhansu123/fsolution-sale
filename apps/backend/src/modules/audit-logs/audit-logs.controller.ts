import { Controller, Get } from "@nestjs/common";
import { AuditLogsService } from "./audit-logs.service";
import { RequirePermission } from "../../common/decorators/require-permission.decorator";

// Chỉ admin — không seed tài khoản chức năng nào cho module "audit-logs" (admin bypass toàn quyền
// không cần tra DB, xem PermissionGuard). Đúng bảng "Module (permission)" implementation_plan.md.
const MODULE = "audit-logs";

@Controller("audit-logs")
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @RequirePermission(MODULE, "view")
  list() {
    return this.auditLogsService.list();
  }
}
