import { Module } from "@nestjs/common";
import { AccountsController } from "./accounts.controller";
import { AccountsService } from "./accounts.service";
import { AuditLogsModule } from "../audit-logs/audit-logs.module";

@Module({
  imports: [AuditLogsModule],
  controllers: [AccountsController],
  providers: [AccountsService],
})
export class AccountsModule {}
