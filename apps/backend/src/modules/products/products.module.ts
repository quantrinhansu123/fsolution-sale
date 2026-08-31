import { Module } from "@nestjs/common";
import { ProductsController } from "./products.controller";
import { ProductsService } from "./products.service";
import { ProductPerformanceController } from "./product-performance.controller";
import { ProductPerformanceService } from "./product-performance.service";
import { AuditLogsModule } from "../audit-logs/audit-logs.module";

@Module({
  imports: [AuditLogsModule],
  controllers: [ProductsController, ProductPerformanceController],
  providers: [ProductsService, ProductPerformanceService],
})
export class ProductsModule {}
