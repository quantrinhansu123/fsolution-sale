import { Module } from "@nestjs/common";
import { MarketingReportsController } from "./marketing-reports.controller";
import { MarketingReportsService } from "./marketing-reports.service";

@Module({
  controllers: [MarketingReportsController],
  providers: [MarketingReportsService],
})
export class MarketingReportsModule {}
