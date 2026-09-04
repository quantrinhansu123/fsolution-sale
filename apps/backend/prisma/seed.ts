import "reflect-metadata";
import { prisma } from "./_seed-client";

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}

// ─────────────────────────────────────────────
// BƯỚC 1: Xóa sạch toàn bộ dữ liệu cũ (theo thứ tự dependency)
// ─────────────────────────────────────────────
async function clearAll() {
  console.log("[seed] Đang xóa dữ liệu cũ...");
  // Xóa theo thứ tự: con trước, cha sau
  await prisma.kPI.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.cskhLog.deleteMany();
  await prisma.feedback.deleteMany();
  await prisma.productPerformance.deleteMany();
  await prisma.cashTransaction.deleteMany();
  await prisma.cashAccount.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.saleReport.deleteMany();
  await prisma.marketingReport.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.leadLog.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.product.deleteMany();
  // Employee phải sau các bảng tham chiếu nó
  await prisma.employee.deleteMany();
  console.log("[seed] Đã xóa sạch dữ liệu cũ.");
}

// ─────────────────────────────────────────────
// BƯỚC 2: Seed dữ liệu mới
// ─────────────────────────────────────────────
async function main() {
  await clearAll();

  // ── 1. PRODUCTS — 8 sản phẩm phần mềm ──────────────────────────
  const products = await Promise.all(
    [
      {
        name: "CRM",
        sku: "SW-CRM",
        unit: "license/năm",
        price: 18000000,
        category: "phan-mem",
      },
      {
        name: "HRM",
        sku: "SW-HRM",
        unit: "license/năm",
        price: 15000000,
        category: "phan-mem",
      },
      {
        name: "SEEDING",
        sku: "SW-SEEDING",
        unit: "license/tháng",
        price: 2500000,
        category: "phan-mem",
      },
      {
        name: "DASHBOARD",
        sku: "SW-DASHBOARD",
        unit: "license/năm",
        price: 8000000,
        category: "phan-mem",
      },
      {
        name: "Quản lý công việc",
        sku: "SW-TASK",
        unit: "license/năm",
        price: 6000000,
        category: "phan-mem",
      },
      {
        name: "Quản lý đơn hàng",
        sku: "SW-ORDER",
        unit: "license/năm",
        price: 12000000,
        category: "phan-mem",
      },
      {
        name: "Thiết kế Website",
        sku: "SVC-WEB",
        unit: "dự án",
        price: 25000000,
        category: "dich-vu",
      },
      {
        name: "Quản lý sản xuất",
        sku: "SW-MES",
        unit: "license/năm",
        price: 30000000,
        category: "phan-mem",
      },
    ].map((data) => prisma.product.create({ data }))
  );
  console.log(`[seed] products: đã tạo ${products.length} sản phẩm.`);

  // ── 2. EMPLOYEES ─────────────────────────────────────────────────
  const employees = await Promise.all(
    [
      { name: "Nguyễn Hoàng Anh", email: "anh.nguyen@fsolution.vn", team: "Sale", branch: "Hà Nội", role: "Sale" },
      { name: "Trần Thị Bảo",    email: "bao.tran@fsolution.vn",   team: "Marketing", branch: "Hà Nội", role: "MKT" },
      { name: "Lê Minh Cường",   email: "cuong.le@fsolution.vn",   team: "CSKH", branch: "TP.HCM", role: "CSKH" },
      { name: "Phạm Thị Duyên",  email: "duyen.pham@fsolution.vn", team: "Kế toán", branch: "TP.HCM", role: "KeToan" },
      { name: "Võ Văn Đức",      email: "duc.vo@fsolution.vn",     team: "Sale", branch: "Đà Nẵng", role: "Sale" },
      { name: "Đỗ Thị Hằng",     email: "hang.do@fsolution.vn",    team: "Marketing", branch: "Hà Nội", role: "MKT" },
    ].map((data) => prisma.employee.create({ data }))
  );
  console.log(`[seed] employees: đã tạo ${employees.length} nhân sự.`);

  // ── 3. CUSTOMERS ─────────────────────────────────────────────────
  const customers = await Promise.all(
    [
      { name: "Công ty TNHH ABC Tech",       phone: "0901100001", address: "72 Lê Thánh Tôn", city: "Hà Nội",  customerType: "old" },
      { name: "Cty CP Sunrise Digital",      phone: "0901100002", address: "18 Hoàng Diệu",   city: "TP.HCM", customerType: "old" },
      { name: "HTX Sản xuất Bình Minh",      phone: "0901100003", address: "45 Phan Bội Châu", city: "Đà Nẵng", customerType: "new" },
      { name: "Công ty TNHH XNK Hoàng Gia", phone: "0901100004", address: "9 Bà Triệu",       city: "Hà Nội",  customerType: "new" },
      { name: "Cty CP Thương mại TechViet",  phone: "0901100005", address: "33 Nguyễn Huệ",   city: "TP.HCM", customerType: "old" },
      { name: "Trường ĐH Bách Khoa HN",      phone: "0901100006", address: "1 Đại Cồ Việt",   city: "Hà Nội",  customerType: "new" },
    ].map((data) => prisma.customer.create({ data }))
  );
  console.log(`[seed] customers: đã tạo ${customers.length} khách hàng.`);

  // ── 4. LEADS ─────────────────────────────────────────────────────
  const leads = await Promise.all(
    [
      { name: "Nguyễn Văn Khoa",   phone: "0912100001", source: "Facebook Ads",       productInterest: "CRM",                 status: "new" },
      { name: "Trần Thị Lan",      phone: "0912100002", source: "Google Search",      productInterest: "HRM",                 status: "contacted" },
      { name: "Lê Quốc Bảo",       phone: "0912100003", source: "Zalo OA",            productInterest: "SEEDING",             status: "qualified" },
      { name: "Phạm Hữu Thọ",      phone: "0912100004", source: "Website Form",       productInterest: "DASHBOARD",           status: "converted" },
      { name: "Hoàng Thị Tuyết",   phone: "0912100005", source: "Giới thiệu khách cũ", productInterest: "Quản lý công việc",  status: "new" },
      { name: "Đặng Minh Trường",  phone: "0912100006", source: "LinkedIn",           productInterest: "Quản lý đơn hàng",   status: "contacted" },
      { name: "Bùi Thị Hương",     phone: "0912100007", source: "Hội thảo công nghệ", productInterest: "Thiết kế Website",   status: "qualified" },
      { name: "Ngô Xuân Vinh",     phone: "0912100008", source: "Cold Call",          productInterest: "Quản lý sản xuất",   status: "lost" },
    ].map((data) => prisma.lead.create({ data }))
  );
  console.log(`[seed] leads: đã tạo ${leads.length} leads.`);

  // ── 5. ORDERS (Hợp đồng) ─────────────────────────────────────────
  const orderStatuses = ["pending", "confirmed", "delivered", "cancelled", "confirmed", "delivered"];
  const orders = await Promise.all(
    orderStatuses.map((status, i) =>
      prisma.order.create({
        data: {
          customerId: pick(customers, i).id,
          totalAmount: pick(products, i).price * (1 + i * 0.1),
          status,
          note: `Hợp đồng triển khai ${pick(products, i).name} cho ${pick(customers, i).name}`,
          items: {
            create: [
              {
                productId:   pick(products, i).id,
                productName: pick(products, i).name,
                quantity:    1,
                unitPrice:   pick(products, i).price,
                isGift:      false,
              },
            ],
          },
        },
      })
    )
  );
  console.log(`[seed] orders: đã tạo ${orders.length} hợp đồng.`);

  // ── 6. CAMPAIGNS ─────────────────────────────────────────────────
  const campaigns = await Promise.all(
    [
      { name: "Ra mắt CRM Q3/2026",          budget: 30000000, market: "Hà Nội",     product: "CRM",                 status: "active" },
      { name: "Quảng bá HRM doanh nghiệp",   budget: 20000000, market: "TP.HCM",    product: "HRM",                 status: "active" },
      { name: "SEEDING - Tháng 8",            budget: 10000000, market: "Toàn quốc", product: "SEEDING",             status: "active" },
      { name: "DASHBOARD cho nhà máy",        budget: 15000000, market: "Đà Nẵng",   product: "DASHBOARD",           status: "paused" },
      { name: "Task Mgmt - Startup Việt",     budget: 8000000,  market: "Toàn quốc", product: "Quản lý công việc",   status: "ended" },
    ].map((data) => prisma.campaign.create({ data }))
  );
  console.log(`[seed] campaigns: đã tạo ${campaigns.length} chiến dịch.`);

  // ── 7. MARKETING REPORTS ─────────────────────────────────────────
  await Promise.all(
    [0, 1, 2, 3, 4].map((i) =>
      prisma.marketingReport.create({
        data: {
          campaignId:     pick(campaigns, i).id,
          date:           new Date(2026, 7, 1 + i * 5),  // tháng 8/2026
          shift:          pick(["sáng", "chiều", "tối"], i),
          product:        pick(products, i).name,
          market:         pick(["Hà Nội", "TP.HCM", "Đà Nẵng", "Toàn quốc"], i),
          team:           "Marketing",
          adCost:         2000000 + i * 500000,
          messageCount:   60 + i * 10,
          orderCount:     2 + i,
          revenue:        pick(products, i).price * (2 + i),
          revenueActual:  pick(products, i).price * (1 + i),
        },
      })
    )
  );
  console.log("[seed] marketingReports: đã tạo 5 báo cáo.");

  // ── 8. SALE REPORTS ──────────────────────────────────────────────
  await Promise.all(
    [0, 1, 2, 3, 4].map((i) =>
      prisma.saleReport.create({
        data: {
          employeeId:      pick(employees, i).id,
          date:            new Date(2026, 7, 1 + i * 5),
          shift:           pick(["sáng", "chiều", "tối"], i),
          product:         pick(products, i).name,
          market:          pick(["Hà Nội", "TP.HCM", "Đà Nẵng"], i),
          messageCount:    40 + i * 5,
          orderCount:      1 + i,
          revenueActual:   pick(products, i).price * (1 + i),
          newCustomerCount: i % 2,
          oldCustomerCount: (i + 1) % 3,
        },
      })
    )
  );
  console.log("[seed] saleReports: đã tạo 5 báo cáo.");

  // ── 9. CSKH LOGS ─────────────────────────────────────────────────
  await Promise.all(
    ["called", "upsell", "cross_sell", "no_answer", "called"].map((status, i) =>
      prisma.cskhLog.create({
        data: {
          orderId:    pick(orders, i).id,
          customerId: pick(customers, i).id,
          staffId:    pick(employees, i).id,
          status,
          note: `Chăm sóc sau ký hợp đồng ${pick(products, i).name}`,
        },
      })
    )
  );
  console.log("[seed] cskhLogs: đã tạo 5 logs.");

  // ── 10. PRODUCT PERFORMANCE ──────────────────────────────────────
  await Promise.all(
    products.map((p: any, i: number) =>
      prisma.productPerformance.create({
        data: {
          productId:      p.id,
          stage:          `GĐ${i + 1}`,
          messageCount:   50 + i * 8,
          adCost:         1500000 + i * 200000,
          orderCount:     1 + i,
          revenue:        p.price * (1 + i),
          evaluation:     pick(["win", "pending", "fail", "win", "pending", "win", "pending", "win"], i),
        },
      })
    )
  );
  console.log("[seed] productPerformances: đã tạo 8 records.");

  // ── 11. FEEDBACKS ────────────────────────────────────────────────
  await Promise.all(
    [5, 4, 5, 3, 5, 4].map((rating, i) =>
      prisma.feedback.create({
        data: {
          customerId: pick(customers, i).id,
          orderId:    pick(orders, i).id,
          source:     pick(["Sale", "CSKH", "MKT"], i),
          content:    `Phản hồi về ${pick(products, i).name}: ${rating >= 4 ? "Hài lòng, dễ sử dụng, tiết kiệm chi phí vận hành." : "Cần cải thiện giao diện mobile."}`,
          rating,
        },
      })
    )
  );
  console.log("[seed] feedbacks: đã tạo 6 phản hồi.");

  // ── 12. PAYMENTS ─────────────────────────────────────────────────
  await Promise.all(
    ["completed", "pending", "completed", "failed", "completed", "pending"].map((status, i) =>
      prisma.payment.create({
        data: {
          orderId: pick(orders, i).id,
          amount:  pick(orders, i).totalAmount,
          status,
          method:  pick(["bank_transfer", "cash", "bank_transfer"], i),
        },
      })
    )
  );
  console.log("[seed] payments: đã tạo 6 thanh toán.");

  // ── 13. CASH ACCOUNTS ────────────────────────────────────────────
  const cashAccounts = await Promise.all(
    [
      { code: "THU-HOPDONG",  name: "Thu hợp đồng phần mềm",  type: "income",  branch: "Hà Nội" },
      { code: "THU-DICHVU",   name: "Thu dịch vụ thiết kế web", type: "income", branch: "TP.HCM" },
      { code: "THU-KHAC",     name: "Thu khác",                 type: "income" },
      { code: "CHI-QUANGCAO", name: "Chi quảng cáo Digital",    type: "expense" },
      { code: "CHI-LUONG",    name: "Chi lương nhân sự",        type: "expense" },
      { code: "CHI-VANHANH",  name: "Chi vận hành hệ thống",    type: "expense" },
    ].map((data) => prisma.cashAccount.create({ data }))
  );
  console.log(`[seed] cashAccounts: đã tạo ${cashAccounts.length} mã TK.`);

  // ── 14. CASH TRANSACTIONS ────────────────────────────────────────
  await Promise.all(
    [
      { idx: 0, content: "Thu hợp đồng CRM - Cty ABC Tech",     amount: 18000000 },
      { idx: 1, content: "Thu thiết kế website - Sunrise",      amount: 25000000 },
      { idx: 2, content: "Thu hợp đồng DASHBOARD",              amount: 8000000  },
      { idx: 3, content: "Chi quảng cáo Facebook tháng 8",      amount: 5000000  },
      { idx: 4, content: "Chi lương tháng 8/2026",              amount: 45000000 },
      { idx: 5, content: "Chi hosting & server tháng 8",        amount: 3500000  },
    ].map(({ idx, content, amount }) =>
      prisma.cashTransaction.create({
        data: {
          cashAccountId:   pick(cashAccounts, idx).id,
          type:            pick(cashAccounts, idx).type,
          content,
          amount,
          transactionDate: new Date(2026, 7, 5 + idx * 3),
        },
      })
    )
  );
  console.log("[seed] cashTransactions: đã tạo 6 giao dịch.");

  // ── 15. KPIs ─────────────────────────────────────────────────────
  await Promise.all(
    employees.map((e: any, i: number) =>
      prisma.kPI.create({
        data: {
          employeeId: e.id,
          period:     "2026-08",
          score:      72 + i * 4,
          bonus:      i >= 2 ? 1000000 + i * 200000 : null,
        },
      })
    )
  );
  console.log("[seed] kpis: đã tạo 6 KPIs.");

  console.log("\n✅ [seed] Hoàn tất seed dữ liệu mới cho F-Solution (mô hình kinh doanh phần mềm).");
}

main()
  .catch((err) => {
    console.error("[seed] Lỗi:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
