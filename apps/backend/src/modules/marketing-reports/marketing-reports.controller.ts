import { BadRequestException, Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from "@nestjs/common";
import { MarketingReportsService } from "./marketing-reports.service";
import { CreateMarketingReportDto } from "./dto/create-marketing-report.dto";
import { RequirePermission } from "../../common/decorators/require-permission.decorator";

const MODULE = "marketing-reports";

@Controller("marketing-reports")
export class MarketingReportsController {
  constructor(private readonly marketingReportsService: MarketingReportsService) {}

  @Get()
  @RequirePermission(MODULE, "view")
  list() {
    return this.marketingReportsService.list();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(MODULE, "edit")
  create(@Body() dto: CreateMarketingReportDto) {
    return this.marketingReportsService.create(dto);
  }

  // Mới — Báo cáo tự động Marketing (doanh thu real-time theo Lead.sourcedBy), đặt SAU "/",
  // TRƯỚC route param nếu có (module này chưa có route ":id" nên không xung đột thứ tự khai báo).
  @Get("auto")
  @RequirePermission(MODULE, "view")
  getAuto(@Query("date") date?: string, @Query("toDate") toDate?: string) {
    if (!date) throw new BadRequestException("Thiếu query param 'date' (YYYY-MM-DD)");
    return this.marketingReportsService.getAuto(date, toDate);
  }
}
