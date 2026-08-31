import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { envValidationSchema } from "./config/env.validation";
import { PrismaModule } from "./prisma/prisma.module";
import { LeadsModule } from "./modules/leads/leads.module";
import { OrdersModule } from "./modules/orders/orders.module";

import { AuthModule } from "./modules/auth/auth.module";
import { AccountsModule } from "./modules/accounts/accounts.module";
import { CustomersModule } from "./modules/customers/customers.module";
import { SaleReportsModule } from "./modules/sale-reports/sale-reports.module";
import { CampaignsModule } from "./modules/campaigns/campaigns.module";
import { MarketingReportsModule } from "./modules/marketing-reports/marketing-reports.module";

import { CskhLogsModule } from "./modules/cskh-logs/cskh-logs.module";
import { ProductsModule } from "./modules/products/products.module";
import { FeedbacksModule } from "./modules/feedbacks/feedbacks.module";
import { PaymentsModule } from "./modules/payments/payments.module";
import { CashAccountsModule } from "./modules/cash-accounts/cash-accounts.module";
import { CashTransactionsModule } from "./modules/cash-transactions/cash-transactions.module";
import { EmployeesModule } from "./modules/employees/employees.module";
import { KpisModule } from "./modules/kpis/kpis.module";
import { SystemConfigModule } from "./modules/system-config/system-config.module";
import { AuditLogsModule } from "./modules/audit-logs/audit-logs.module";
import { DashboardModule } from "./modules/dashboard/dashboard.module";
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";
import { PermissionGuard } from "./common/guards/permission.guard";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
    }),
    PrismaModule,
    AuthModule,
    AccountsModule,
    LeadsModule,
    OrdersModule,
    CustomersModule,
    SaleReportsModule,
    CampaignsModule,
    MarketingReportsModule,
    CskhLogsModule,
    ProductsModule,
    FeedbacksModule,
    PaymentsModule,
    CashAccountsModule,
    CashTransactionsModule,
    EmployeesModule,
    KpisModule,
    SystemConfigModule,
    AuditLogsModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Thứ tự quan trọng: JwtAuthGuard chạy trước để gắn request.user, PermissionGuard
    // đọc request.user sau đó — xem skills/build/auth-and-permissions/SKILL.md.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionGuard },
  ],
})
export class AppModule {}
