import { Module } from "@nestjs/common";
import { SystemConfigController } from "./system-config.controller";
import { SystemConfigService } from "./system-config.service";
import { AuditLogsModule } from "../audit-logs/audit-logs.module";

@Module({
  imports: [AuditLogsModule],
  controllers: [SystemConfigController],
  providers: [SystemConfigService],
})
export class SystemConfigModule {}
