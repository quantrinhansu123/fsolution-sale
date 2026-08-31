import "reflect-metadata";
import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const DEFAULT_PASSWORD = "abc123";

// Khớp đúng tên module nghiệp vụ thật dưới apps/backend/src/modules/<module>/.
// username = số ít, chữ thường, không dấu — xem skills/build/auth-and-permissions/SKILL.md mục 4.
const FUNCTIONAL_ACCOUNTS = [
  { username: "lead",             module: "leads" },
  { username: "order",            module: "orders" },
  { username: "customer",         module: "customers" },
  { username: "salereport",       module: "sale-reports" },
  { username: "campaign",         module: "campaigns" },
  { username: "marketingreport",  module: "marketing-reports" },
  { username: "cskhlog",          module: "cskh-logs" },
  { username: "product",          module: "products" },
  { username: "feedback",         module: "feedbacks" },
  { username: "payment",          module: "payments" },
  { username: "cashaccount",      module: "cash-accounts" },
  { username: "cashtransaction",  module: "cash-transactions" },
  { username: "employee",         module: "employees" },
  { username: "kpi",              module: "kpis" },
  { username: "systemconfig",     module: "system-config" },
  // Không seed tài khoản cho "audit-logs" — chỉ admin xem, theo implementation_plan.md (bảng
  // "Module (permission)" #24: "AuditLog | audit-logs (chỉ admin)").
];


async function upsertAccount(username: string, isAdmin: boolean) {
  return prisma.account.upsert({
    where: { username },
    update: {}, // KHÔNG reset mật khẩu nếu account đã tồn tại
    create: { username, passwordHash: await bcrypt.hash(DEFAULT_PASSWORD, 10), isAdmin },
  });
}

async function main() {
  const admin = await upsertAccount("admin", true);
  console.log(`[seed-accounts] admin: giữ nguyên nếu đã có, tạo mới nếu chưa (id=${admin.id})`);

  for (const { username, module } of FUNCTIONAL_ACCOUNTS) {
    const account = await upsertAccount(username, false);
    await prisma.permission.upsert({
      where: { accountId_module: { accountId: account.id, module } },
      update: {}, // KHÔNG ghi đè nếu admin đã tự chỉnh quyền của tài khoản này
      create: { accountId: account.id, module, canView: true, canEdit: true, canDelete: true },
    });
    console.log(`[seed-accounts] "${username}" -> full quyền trên module "${module}"`);
  }
}

main()
  .catch((err) => {
    console.error("[seed-accounts]", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
