import { Module } from "@nestjs/common";
import { CustomersController } from "./customers.controller";
import { CustomersService } from "./customers.service";
import { AuditLogsModule } from "../audit-logs/audit-logs.module";

@Module({
  imports: [AuditLogsModule],
  controllers: [CustomersController],
  providers: [CustomersService],
})
export class CustomersModule {}
