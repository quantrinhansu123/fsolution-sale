import { Body, Controller, Get, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { ProductPerformanceService } from "./product-performance.service";
import { CreateProductPerformanceDto } from "./dto/create-product-performance.dto";
import { RequirePermission } from "../../common/decorators/require-permission.decorator";

// Cùng quyền "products" (không tách module riêng) — xem bảng "Module (permission)" trong
// docs/implementation_plan.md, tương tự TrackingLog dùng chung quyền "shipments".
const MODULE = "products";

@Controller("product-performance")
export class ProductPerformanceController {
  constructor(private readonly productPerformanceService: ProductPerformanceService) {}

  @Get()
  @RequirePermission(MODULE, "view")
  list() {
    return this.productPerformanceService.list();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(MODULE, "edit")
  create(@Body() dto: CreateProductPerformanceDto) {
    return this.productPerformanceService.create(dto);
  }
}
