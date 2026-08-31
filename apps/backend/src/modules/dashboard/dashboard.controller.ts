import { BadRequestException, Controller, Get, Query } from "@nestjs/common";
import { DashboardService } from "./dashboard.service";
import { RequirePermission } from "../../common/decorators/require-permission.decorator";
import { DashboardPeriodType } from "./period-range";

const MODULE = "dashboard";
const VALID_PERIODS: DashboardPeriodType[] = ["day", "week", "month"];

// Chỉ admin — không seed tài khoản chức năng nào cho module "dashboard" (admin bypass toàn quyền
// không cần tra DB, xem PermissionGuard), cùng cách "audit-logs" đang làm.
@Controller("dashboard")
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get("overview")
  @RequirePermission(MODULE, "view")
  getOverview(@Query("period") period: string = "month") {
    if (!VALID_PERIODS.includes(period as DashboardPeriodType)) {
      throw new BadRequestException("period phải là day|week|month");
    }
    return this.dashboardService.getOverview(period as DashboardPeriodType);
  }
}
