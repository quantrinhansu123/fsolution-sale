import { BadRequestException, Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from "@nestjs/common";
import { SaleReportsService } from "./sale-reports.service";
import { CreateSaleReportDto } from "./dto/create-sale-report.dto";
import { RequirePermission } from "../../common/decorators/require-permission.decorator";

const MODULE = "sale-reports";

@Controller("sale-reports")
export class SaleReportsController {
  constructor(private readonly saleReportsService: SaleReportsService) {}

  @Get()
  @RequirePermission(MODULE, "view")
  list() {
    return this.saleReportsService.list();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(MODULE, "edit")
  create(@Body() dto: CreateSaleReportDto) {
    return this.saleReportsService.create(dto);
  }

  // Mới (Phase 3) — báo cáo Sale tự động, tính real-time. Đặt SAU "/", TRƯỚC route param nếu có
  // (module này chưa có route ":id" nên không xung đột thứ tự khai báo).
  @Get("auto")
  @RequirePermission(MODULE, "view")
  getAuto(@Query("date") date?: string, @Query("toDate") toDate?: string) {
    if (!date) throw new BadRequestException("Thiếu query param 'date' (YYYY-MM-DD)");
    return this.saleReportsService.getAuto(date, toDate);
  }
}
