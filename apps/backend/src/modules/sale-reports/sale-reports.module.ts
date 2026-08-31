import { Module } from "@nestjs/common";
import { SaleReportsController } from "./sale-reports.controller";
import { SaleReportsService } from "./sale-reports.service";

@Module({
  controllers: [SaleReportsController],
  providers: [SaleReportsService],
})
export class SaleReportsModule {}
