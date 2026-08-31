# Task Breakdown: F-Solution — CRM/ERP công ty phần mềm

> Sinh bởi `/plan` (GPT-OSS, Phiên #3) dựa trên `docs/implementation_plan.md`. Bảng dưới được Claude Code CLI chuẩn hoá lại đúng định dạng bảng markdown mà `tools/bin/gptoss_claudecli_bridge.js` cần để nhận diện task thật (`check build` trước đó BLOCKED vì bản gốc chỉ có heading/bullet, không có bảng) — **nội dung giữ nguyên**, chỉ đổi hình thức trình bày. Xem nguyên văn chi tiết từng task ở mục "Chi tiết" bên dưới.
>
> **Giai đoạn 4-9 dưới đây (Phase 2) được `/plan` lại hoàn toàn ở Phiên #21** — thay thế bản Giai đoạn 4-6 cũ do GPT-OSS viết ở Phiên #19, vốn dựa trên contract Phase 2 dạng stub mỏng (8 entity, chỉ GET) của Phiên #18. Sau khi người dùng cung cấp tài liệu nghiệp vụ chi tiết 42 trang, `docs/implementation_plan.md` và `docs/api-contract.openapi.yaml` đã được viết lại đầy đủ ở Phiên #20 (24 nhóm entity/endpoint) — bảng dưới chia lại task cho khớp đúng contract mới đó. Giai đoạn 1-3 (Phase 1, đã `done`) giữ nguyên không đổi.

| # | Task | App | Phụ thuộc | Trạng thái |
| :-- | :-- | :-- | :-- | :-- |
| 1.1 | Thêm model `Lead`, `Order`, `Inventory` vào `prisma/schema.prisma` | backend | none | done |
| 1.2 | Chạy migration Prisma (`prisma migrate dev --name init_core_modules`) | backend | 1.1 | done |
| 1.3 | Định nghĩa DTO dùng chung trong `packages/shared-types` | backend | 1.1 | done |
| 2.1 | Module Leads — `GET/POST /leads` | backend | 1.2, 1.3 | done |
| 2.2 | Module Orders — `GET/POST /orders` | backend | 1.2, 1.3 | done |
| 2.3 | Module Inventory — `GET /inventory` | backend | 1.2, 1.3 | done |
| 3.1 | Cập nhật `apiClient.ts` gọi `/leads`, `/orders`, `/inventory` | frontend | 2.1, 2.2, 2.3 | done |
| 3.2 | Trang `LeadsPage` (danh sách + form tạo mới) | frontend | 3.1 | done |
| 3.3 | Trang `OrdersPage` (danh sách + form tạo mới) | frontend | 3.1 | done |
| 3.4 | Trang `InventoryPage` (danh sách tồn kho) | frontend | 3.1 | done |
| 3.5 | Layout + điều hướng Leads/Orders/Inventory, theo `ui-ux-pro-max` | frontend | 3.2, 3.3, 3.4 | done |
| 4.1 | Schema: thêm `LeadLog`, `Customer`, `OrderItem`, `SaleReport` + field `assignedTo`/`score` mới trên `Lead` | backend | none | done |
| 4.2 | Chạy migration Prisma (`prisma migrate dev --name add_phase2_crm_sales`) | backend | 4.1 | done |
| 4.3 | DTO shared-types: `Customer`, `OrderItem`, `LeadLog`, `SaleReport`, `UpdateLeadInput`, `UpdateOrderInput`, `CreateOrderItemInput`, `CreateCustomerInput`, `UpdateCustomerInput`, `CreateSaleReportInput` | backend | 4.1 | done |
| 4.4 | Mở rộng `LeadsModule` — `PATCH /leads/{id}`, `GET /leads/{id}/logs` (tự ghi `LeadLog` khi đổi status) | backend | 4.2, 4.3 | done |
| 4.5 | Mở rộng `OrdersModule` — `PATCH /orders/{id}` (khoá sửa khi status=delivered/cancelled), `GET/POST /orders/{id}/items` | backend | 4.2, 4.3 | done |
| 4.6 | Module `CustomersModule` — `GET/POST/PATCH /customers` | backend | 4.2, 4.3 | done |
| 4.7 | Module `SaleReportsModule` — `GET/POST /sale-reports` | backend | 4.2, 4.3 | done |
| 4.8 | `apiClient.ts` — thêm hàm gọi endpoint CRM/Sales mở rộng (4.4-4.7) | frontend | 4.4, 4.5, 4.6, 4.7 | done |
| 4.9 | Trang `CustomersPage` (danh sách + form tạo/sửa) | frontend | 4.8 | done |
| 4.10 | Cập nhật `LeadsPage` (đổi trạng thái/phân bổ Sale, xem lịch sử) + `OrdersPage` (xem order items, cập nhật trạng thái) | frontend | 4.8 | done |
| 5.1 | Schema: mở rộng `Campaign` (market, product), thêm `MarketingReport` | backend | none | done |
| 5.2 | Chạy migration Prisma (`prisma migrate dev --name add_phase2_marketing`) | backend | 5.1 | done |
| 5.3 | DTO shared-types: `Campaign` mở rộng, `UpdateCampaignInput`, `MarketingReport`, `CreateMarketingReportInput` | backend | 5.1 | done |
| 5.4 | Mở rộng `CampaignsModule` — `PATCH /campaigns/{id}` | backend | 5.2, 5.3 | done |
| 5.5 | Module `MarketingReportsModule` — `GET/POST /marketing-reports` | backend | 5.2, 5.3 | done |
| 5.6 | `apiClient.ts` — thêm hàm gọi endpoint Marketing (5.4-5.5) | frontend | 5.4, 5.5 | done |
| 5.7 | Cập nhật `CampaignsPage` (thêm sửa) + trang `MarketingReportsPage` (nhập báo cáo tay) | frontend | 5.6 | done |
| 6.1 | Schema: mở rộng `Shipment` (packedAt, dispatchedAt, phí), thêm `TrackingLog`, `Warehouse`, `InventoryTransaction`, `InventoryBatch` | backend | none | done |
| 6.2 | Chạy migration Prisma (`prisma migrate dev --name add_phase2_logistics`) | backend | 6.1 | done |
| 6.3 | DTO shared-types tương ứng cho 6.1 | backend | 6.1 | done |
| 6.4 | Mở rộng `ShipmentsModule` — `PATCH /shipments/{id}` (chặn set delivered khi chưa có trackingCode), `GET/POST /shipments/{id}/tracking-logs` | backend | 6.2, 6.3 | done |
| 6.5 | Module `WarehousesModule` — `GET/POST /warehouses` | backend | 6.2, 6.3 | done |
| 6.6 | Module `InventoryTransactionsModule` — `GET/POST /inventory-transactions` (validate tồn khả dụng = tồn thực − đơn giữ chỗ trước khi issue), `GET /inventory-batches`, tự cập nhật `Inventory` tương ứng | backend | 6.2, 6.3 | done |
| 6.7 | `apiClient.ts` — thêm hàm gọi endpoint Logistics/Kho (6.4-6.6) | frontend | 6.4, 6.5, 6.6 | done |
| 6.8 | Cập nhật `ShipmentsPage` (cập nhật trạng thái, xem tracking log) + trang `WarehousesPage` + `InventoryTransactionsPage` (nhập/xuất/điều chỉnh) | frontend | 6.7 | done |
| 7.1 | Schema: thêm `CskhLog`; mở rộng `Product` (category), thêm `ProductPerformance`; mở rộng `Feedback` (source, orderId) | backend | none | done |
| 7.2 | Chạy migration Prisma (`prisma migrate dev --name add_phase2_cskh_rd`) | backend | 7.1 | done |
| 7.3 | DTO shared-types tương ứng cho 7.1 | backend | 7.1 | done |
| 7.4 | Module `CskhLogsModule` — `GET/POST /cskh-logs` | backend | 7.2, 7.3 | done |
| 7.5 | Mở rộng `ProductsModule` — `PATCH /products/{id}` | backend | 7.2, 7.3 | done |
| 7.6 | Module `ProductPerformanceModule` — `GET/POST /product-performance` | backend | 7.2, 7.3 | done |
| 7.7 | Mở rộng `FeedbacksModule` — `POST /feedbacks` (đã có `GET` từ bản stub cũ) | backend | 7.2, 7.3 | done |
| 7.8 | `apiClient.ts` — thêm hàm gọi endpoint CSKH/R&D (7.4-7.7) | frontend | 7.4, 7.5, 7.6, 7.7 | done |
| 7.9 | Trang `CskhLogsPage` + cập nhật `ProductsPage` (sửa, xem hiệu quả test) + trang `FeedbacksPage` | frontend | 7.8 | done |
| 8.1 | Schema: mở rộng `Payment` (feeBreakdown, reconciledAt), thêm `CashAccount`, `CashTransaction` | backend | none | done |
| 8.2 | Chạy migration Prisma (`prisma migrate dev --name add_phase2_finance`) | backend | 8.1 | done |
| 8.3 | DTO shared-types tương ứng cho 8.1 | backend | 8.1 | done |
| 8.4 | Mở rộng `PaymentsModule` — `PATCH /payments/{id}` (chặn set completed khi chưa có bill) | backend | 8.2, 8.3 | done |
| 8.5 | Module `CashAccountsModule` — `GET/POST /cash-accounts` | backend | 8.2, 8.3 | done |
| 8.6 | Module `CashTransactionsModule` — `GET/POST /cash-transactions` (gộp Thu+Chi, phân biệt qua `type`) | backend | 8.2, 8.3 | done |
| 8.7 | `apiClient.ts` — thêm hàm gọi endpoint Kế toán (8.4-8.6) | frontend | 8.4, 8.5, 8.6 | done |
| 8.8 | Cập nhật `PaymentsPage` + trang `CashAccountsPage` + `CashTransactionsPage` (sổ quỹ) | frontend | 8.7 | done |
| 9.1 | Schema: mở rộng `Employee` (email, team, branch, role, accountId), `KPI` (bonus); thêm `SystemConfig`, `AuditLog` | backend | none | done |
| 9.2 | Chạy migration Prisma (`prisma migrate dev --name add_phase2_hr_admin`) | backend | 9.1 | done |
| 9.3 | DTO shared-types tương ứng cho 9.1 | backend | 9.1 | done |
| 9.4 | Mở rộng `EmployeesModule` — `PATCH /employees/{id}` | backend | 9.2, 9.3 | done |
| 9.5 | Mở rộng `KpisModule` — `POST /kpis` (đã có `GET` từ bản stub cũ) | backend | 9.2, 9.3 | done |
| 9.6 | Module `SystemConfigModule` — `GET /system-configs`, `PATCH /system-configs/{key}` | backend | 9.2, 9.3 | done |
| 9.7 | Module `AuditLogsModule` — `GET /audit-logs` (chỉ admin); các Service khác tự ghi log khi sửa dữ liệu quan trọng | backend | 9.2, 9.3 | done |
| 9.8 | `apiClient.ts` — thêm hàm gọi endpoint HR/Admin/Audit (9.4-9.7) | frontend | 9.4, 9.5, 9.6, 9.7 | done |
| 9.9 | Cập nhật `EmployeesPage` + trang `KPIsPage` + `SystemConfigsPage` + `AuditLogsPage` (chỉ admin xem) | frontend | 9.8 | done |
| 9.10 | Tích hợp toàn bộ trang Phase 2 mới vào Sidebar Navigation, theo `ui-ux-pro-max` | frontend | 4.9, 4.10, 5.7, 6.8, 7.9, 8.8, 9.9 | done |
| 10.1 | Schema: `Lead` +`code`/`productInterest`/`threadId`; `LeadLog` +`fieldChanged`/`oldValue`/`newValue`, `toStatus` nullable | backend | none | done |
| 10.2 | Chạy migration Prisma (`prisma migrate dev --name add_phase3_lead_fields`) | backend | 10.1 | done |
| 10.3 | DTO shared-types tương ứng cho 10.1 (`Lead`, `CreateLeadInput`, `LeadLog`) | backend | 10.1 | done |
| 10.4 | `LeadsService`: sinh `code` unique 4 ký tự lúc tạo (retry khi trùng), round-robin gán `assignedTo` (Employee role=Sale, status=active) khi không truyền, ghi `LeadLog` + `AuditLog` khi đổi `assignedTo` (không chỉ status như hiện tại) | backend | 10.2, 10.3 | done |
| 10.5 | `LeadsService.list()`: lọc theo Sale đăng nhập (row-level, chỉ khi Employee.accountId link + role=Sale + không phải admin); thêm query param `status`/`assignedTo=me` | backend | 10.4 | done |
| 10.6 | `apiClient.ts` + `LeadsPage`: form thêm "Sản phẩm khách hàng quan tâm"/"Mã hội thoại"; cột Mã Lead + 2 cột mới ở Danh sách Leads | frontend | 10.5 | done |
| 11.1 | `AccountsService`: `AccountProfile` trả thêm `employeeName` (join ngược `Employee.accountId`, không lưu DB) | backend | none | done |
| 11.2 | `AccountsPage`: thêm cột "Tên nhân viên" | frontend | 11.1 | done |
| 12.1 | Schema: `Order` +`leadId`/`assignedTo`/`shippingAddress`/`shippingPhone`/`note`; `OrderItem` +`discountPercent` | backend | none | done |
| 12.2 | Chạy migration Prisma (`prisma migrate dev --name add_phase3_order_fields`) | backend | 12.1 | done |
| 12.3 | DTO shared-types tương ứng cho 12.1 (`Order`, `CreateOrderInput` mở rộng, `OrderItem`) | backend | 12.1 | done |
| 12.4 | `OrdersService.create()`: upsert `Customer` theo `shippingPhone` (chưa có→`new`, đã có→`old`), tạo Order + 1 OrderItem đầu tiên cùng 1 `$transaction`, mặc định `assignedTo` = Sale đang gọi API nếu không truyền | backend | 12.2, 12.3 | done |
| 12.5 | `OrdersService.list()`: lọc theo Sale đăng nhập (row-level, cùng cơ chế 10.5), nhúng `items[]` trong response | backend | 12.4 | done |
| 12.6 | `apiClient.ts` + `OrdersPage`: đổi "Chọn khách hàng" → "Chọn mã Lead" (dropdown Lead `status=converted` của chính Sale, cho phép để trống), form đủ field mới (sản phẩm/SL/giá/%KM/địa chỉ/SĐT/ghi chú), cột mới ở Danh sách Hợp đồng | frontend | 12.5, 10.6 | done |
| 13.1 | `AuditLog`: bổ sung `auditLogsService.record()` ở `Campaigns.update()` + `Customers.update()` (module thật cần sửa — `MarketingReports` chỉ có `POST`, không có `update`, nên không có gì để log, xem ghi chú bên dưới bảng) | backend | none | done |
| 13.2 | `AuditLog`: bổ sung ở `Shipments.update()` (giữ nguyên `TrackingLog` đã có sẵn cho status; `SaleReports` chỉ có `POST`, không cần sửa) | backend | none | done |
| 13.3 | Rà soát `Warehouses`/`CskhLogs`: cả 2 chỉ có `GET/POST`, không có `update`/`delete` → không có field nào để diff, không cần sửa (khớp đúng convention `employees.create()` cũng không log) | backend | none | done |
| 13.4 | `AuditLog`: bổ sung ở `Products.update()` (`ProductPerformance`/`Feedbacks` chỉ có `POST`, không cần sửa) | backend | none | done |
| 13.5 | Rà soát `CashAccounts`/`CashTransactions`/`KPIs`: cả 3 chỉ có `GET/POST`, không có `update` → không cần sửa | backend | none | done |
| 13.6 | `AuditLog`: bổ sung ở `Accounts.update()` (username/resetPassword), `Accounts.remove()` (fieldChanged=deleted), `setPermissions()` (diff từng field quyền) — phát hiện và tự sửa 1 bug thật lúc viết test: so `prev` với `undefined` thay vì mặc định `false` khiến quyền mới tạo bị log thừa cả 3 field dù chỉ 1 field thực sự đổi | backend | none | done |
| 13.7 | Verify `AuditLogsPage`/hành vi log bằng lệnh thật (curl end-to-end qua API, không chỉ đọc code): xác nhận `/audit-logs` phủ 12 bảng (Lead/Order/Payment/SystemConfig/Product/Employee/Campaign/Customer/Shipment/Inventory/Permission/Account) sau khi thao tác thật — trước đó gần như rỗng đúng như người dùng báo | frontend | 10.4, 12.4, 13.1, 13.2, 13.4, 13.6 | done |
| 14.1 | `SaleReportsService.getAuto(date)` — tính theo công thức trong `implementation_plan.md` mục "Công thức tính SaleReportAuto"; Controller `GET /sale-reports/auto` | backend | 10.4, 12.4 | done |
| 14.2 | DTO shared-types: `SaleReportAuto` | backend | 14.1 | done |
| 14.3 | `apiClient.ts` + `SaleReportsPage`: đổi nguồn dữ liệu sang `/sale-reports/auto`, bỏ form nhập tay | frontend | 14.2 | done |
| 15.1 | `ui-ux-pro-max`: chốt token màu thương hiệu từ `#428000`/`#84A066` (đủ variant hover/nền nhạt), thêm asset logo (`D:\San\Python\new logo\logo01-4.png`) vào frontend | frontend | none | done |
| 15.2 | `src/styles/index.css` (ghi đè thang màu `amber` mặc định của Tailwind qua khối `@theme` — áp dụng cho toàn bộ 297 chỗ dùng `amber-*` có sẵn, không cần sửa từng file), `Layout.tsx`/`LoginPage.tsx` hiện logo thay ô "SG", `index.html` favicon | frontend | 15.1 | done |

**Điều chỉnh phát hiện khi build Giai đoạn 13** (khác với dự kiến ban đầu ở `/plan`): audit log trong
codebase này chỉ có ý nghĩa với method **update/delete** (ghi diff field cũ→mới) — method `create()`
không có "giá trị cũ" để diff nên đúng theo convention sẵn có (`employees.create()`, `products.create()`
chưa từng gọi `auditLogsService.record()` dù đã có từ Phase 2) không cần bổ sung gì. Trong 19 module ban
đầu liệt kê "thiếu audit log", chỉ **5 module thực sự có `update()`/`delete()` mà chưa gọi**:
`Campaigns`, `Customers`, `Shipments`, `Products`, `Accounts` — đã sửa đủ cả 5 (13.1-13.2, 13.4, 13.6).
14 module còn lại (`MarketingReports`, `SaleReports`, `TrackingLogs`, `Warehouses`, `CskhLogs`,
`ProductPerformance`, `Feedbacks`, `CashAccounts`, `CashTransactions`, `KPIs`...) chỉ có `GET/POST`,
không có gì để diff — không phải lỗi bỏ sót, không cần task riêng.

Quy tắc: không có task nào được đánh dấu `done` nếu thiếu test tương ứng đã pass.

**Checkpoint sau mỗi Giai đoạn 4-9**: `tsc --noEmit` sạch cả 2 app, test liên quan pass (Jest/Supertest backend, Vitest/RTL frontend), `api-contract.openapi.yaml` khớp 100% implementation (nguyên tắc #5, `agents/architect.md`) trước khi sang Giai đoạn kế tiếp — không bắt buộc làm tuần tự 4→9, có thể chọn 1 Giai đoạn ưu tiên làm trước tuỳ nhu cầu nghiệp vụ thực tế.

**Checkpoint sau mỗi Giai đoạn 10-15 (Phase 3)**: cùng tiêu chí trên, thêm 1 điều kiện riêng — chạy
thử **thật** trên trình duyệt (`http://localhost:5174`) đúng màn hình vừa sửa trước khi đánh
`done` (đây là round bug-fix từ việc người dùng tự test UI thật, "tsc sạch + test pass" không đủ để
kết luận đã hết vấn đề, xem lại chính vấn đề #7 — code từng "trông đúng" nhưng audit-logs vẫn rỗng).
Thứ tự khuyến nghị: 10 → 11 → 12 (12.6 phụ thuộc 10.6) → 13 (6 task con 13.1-13.6 độc lập, làm song
song được) → 14 (phụ thuộc 10, 12) → 15 (độc lập hoàn toàn, làm bất kỳ lúc nào).

## Chi tiết (nguyên văn từ `/plan`, Phiên #3)

### Giai đoạn 1: Database & Shared Types (Prisma)

* **Task 1.1**: Cập nhật `projects/fsolution/apps/backend/prisma/schema.prisma` với các model:
    * `Lead` (id, name, phone, source, status, createdAt, updatedAt)
    * `Order` (id, customerId, totalAmount, status, createdAt, updatedAt)
    * `Inventory` (id, productId, quantity, warehouse, updatedAt)
* **Task 1.2**: Chạy migration bằng lệnh `npx prisma migrate dev --name init_core_modules` (lưu ý dùng cơ sở dữ liệu nội bộ qua docker-compose hoặc embedded-postgres theo hướng dẫn).
* **Task 1.3**: Định nghĩa các DTO (Data Transfer Objects) tương ứng trong `projects/fsolution/packages/shared-types/src/index.ts` để dùng chung cho backend và frontend (ví dụ: `CreateLeadDto`, `OrderResponseDto`, `InventoryResponseDto`).

### Giai đoạn 2: Backend (NestJS)

* **Task 2.1 (Leads Module)**:
    * Tạo mới các file cho `LeadsModule` (Module, Controller, Service).
    * Triển khai logic cho `GET /api/v1/leads` và `POST /api/v1/leads`.
* **Task 2.2 (Orders Module)**:
    * Tạo mới các file cho `OrdersModule` (Module, Controller, Service).
    * Triển khai logic cho `GET /api/v1/orders` và `POST /api/v1/orders`.
* **Task 2.3 (Inventory Module)**:
    * Tạo mới các file cho `InventoryModule` (Module, Controller, Service).
    * Triển khai logic cho `GET /api/v1/inventory`.

### Giai đoạn 3: Frontend (React + Vite)

* **Task 3.1 (Setup API Client)**:
    * Cập nhật `apiClient.ts` trong frontend để fetch dữ liệu từ `/leads`, `/orders`, `/inventory` (sử dụng React Query).
* **Task 3.2 (CRM/Leads View)**:
    * Tạo component `LeadsPage` hiển thị danh sách khách hàng tiềm năng.
    * Xây dựng form thêm Lead mới.
* **Task 3.3 (Sales/Orders View)**:
    * Tạo component `OrdersPage` hiển thị danh sách hợp đồng.
    * Xây dựng form tạo Order cơ bản.
* **Task 3.4 (Logistics/Inventory View)**:
    * Tạo component `InventoryPage` hiển thị báo cáo tồn kho.
* **Task 3.5 (Tích hợp UI)**:
    * Cập nhật layout chính để bổ sung thanh điều hướng (Navigation) chuyển qua lại giữa các màn hình Leads, Orders, Inventory.
    * Đảm bảo tuân thủ nguyên tắc `UI/UX Pro Max` (thiết kế chuyên nghiệp, có responsive, state quản lý rõ ràng).

## Chi tiết Phase 2 (`/plan` lại ở Phiên #21, dựa trên `implementation_plan.md`/`api-contract.openapi.yaml` Phiên #20)

Không tạo task riêng cho đăng nhập/phân quyền/Quản lý tài khoản — baseline `/build` tự scaffold theo
`skills/build/auth-and-permissions/SKILL.md` (đã áp dụng cho `fsolution` ở Phiên #16-17, ngoài
phạm vi Phase 2 này). Mỗi module backend mới bên dưới cần gắn `@RequirePermission("<module>", ...)`
đúng tên cột "Module (permission)" đã liệt kê trong `implementation_plan.md`.

### Giai đoạn 4: CRM & Sales mở rộng

* **Task 4.1-4.3**: Thêm `LeadLog`, `Customer`, `OrderItem`, `SaleReport` vào `schema.prisma` (kèm 2
  field mới `assignedTo`/`score` trên `Lead`, additive — không đổi field cũ); migrate; DTO
  `shared-types` tương ứng (bao gồm `UpdateLeadInput`, `UpdateOrderInput`, `CreateOrderItemInput`).
* **Task 4.4**: Mở rộng `LeadsModule` — `PATCH /leads/{id}` (đổi `status`/`assignedTo`, tự ghi
  `LeadLog`), `GET /leads/{id}/logs` (chỉ đọc).
* **Task 4.5**: Mở rộng `OrdersModule` — `PATCH /orders/{id}` (**bắt buộc chặn sửa nếu `status` hiện
  tại đã là `delivered`/`cancelled`** — nguyên tắc #6 khoá sửa theo giai đoạn), `GET/POST
  /orders/{id}/items` (nhiều sản phẩm/quà tặng trong 1 đơn).
* **Task 4.6**: `CustomersModule` mới — `GET/POST/PATCH /customers`, `phone` unique (chuẩn hoá,
  tránh trùng khách hàng).
* **Task 4.7**: `SaleReportsModule` mới — `GET/POST /sale-reports` (dữ liệu báo cáo nhập tay, **không
  phải nguồn sự thật** — nguyên tắc #4, không dùng để tính doanh thu thật).
* **Task 4.8-4.10**: `apiClient.ts` mở rộng; trang `CustomersPage` mới; `LeadsPage`/`OrdersPage` cập
  nhật thêm luồng đổi trạng thái + xem chi tiết (order items/lead logs).

### Giai đoạn 5: Marketing

* **Task 5.1-5.3**: Mở rộng `Campaign` (`market`, `product`); thêm `MarketingReport`; migrate; DTO.
* **Task 5.4**: Mở rộng `CampaignsModule` — `PATCH /campaigns/{id}`.
* **Task 5.5**: `MarketingReportsModule` mới — `GET/POST /marketing-reports` (dữ liệu báo cáo nhập
  tay — nguyên tắc #4).
* **Task 5.6-5.7**: `apiClient.ts` mở rộng; `CampaignsPage` cập nhật (thêm sửa) + `MarketingReportsPage` mới.

### Giai đoạn 6: Logistics & Kho hàng

* **Task 6.1-6.3**: Mở rộng `Shipment` (`packedAt`, `dispatchedAt`, phí — đổi tên field việt hoá của
  tài liệu gốc sang camelCase); thêm `TrackingLog`, `Warehouse`, `InventoryTransaction`,
  `InventoryBatch`; migrate; DTO.
* **Task 6.4**: Mở rộng `ShipmentsModule` — `PATCH /shipments/{id}` (**bắt buộc: không có
  `trackingCode` thì không cho set `status=delivered`** — nguyên tắc #3), `GET/POST
  /shipments/{id}/tracking-logs` (tự ghi khi đổi status).
* **Task 6.5**: `WarehousesModule` mới — `GET/POST /warehouses`.
* **Task 6.6**: `InventoryTransactionsModule` mới — `GET/POST /inventory-transactions` (**bắt buộc
  validate**: `type=issue` phải kiểm tra tồn khả dụng = tồn thực − đơn giữ chỗ trước khi cho xuất,
  trả `409` nếu vượt tồn; `type=adjustment` bắt buộc có `reason`), `GET /inventory-batches` (chỉ đọc);
  mọi giao dịch phải cập nhật `Inventory` (Phase 1) tương ứng ở cùng transaction DB.
* **Task 6.7-6.8**: `apiClient.ts` mở rộng; `ShipmentsPage` cập nhật (đổi trạng thái, xem tracking) +
  `WarehousesPage` mới + `InventoryTransactionsPage` mới (nhập/xuất/điều chỉnh).

### Giai đoạn 7: CSKH & R&D

* **Task 7.1-7.3**: Thêm `CskhLog`; mở rộng `Product` (`category`); thêm `ProductPerformance`; mở
  rộng `Feedback` (`source`, `orderId`); migrate; DTO.
* **Task 7.4**: `CskhLogsModule` mới — `GET/POST /cskh-logs` (ghi nhận gọi lại/upsell/cross-sell).
* **Task 7.5**: Mở rộng `ProductsModule` — `PATCH /products/{id}`.
* **Task 7.6**: `ProductPerformanceModule` mới — `GET/POST /product-performance` (đánh giá
  `win`/`fail`/`pending` theo từng giai đoạn test).
* **Task 7.7**: Mở rộng `FeedbacksModule` — thêm `POST /feedbacks` (contract cũ chỉ có `GET`).
* **Task 7.8-7.9**: `apiClient.ts` mở rộng; `CskhLogsPage` mới + `ProductsPage` cập nhật (sửa, xem
  hiệu quả test) + `FeedbacksPage` mới.

### Giai đoạn 8: Kế toán & Tài chính

* **Task 8.1-8.3**: Mở rộng `Payment` (`feeBreakdown` object tự do, `reconciledAt`); thêm
  `CashAccount`, `CashTransaction` (gộp "Quản lý Thu" + "Quản lý Chi" của tài liệu nguồn thành 1
  resource phân biệt qua `type`); migrate; DTO.
* **Task 8.4**: Mở rộng `PaymentsModule` — `PATCH /payments/{id}` (**bắt buộc: `status=completed`
  phải kèm bằng chứng đối soát** — nguyên tắc #3, không có bill thì không được set đã thu tiền).
* **Task 8.5**: `CashAccountsModule` mới — `GET/POST /cash-accounts` (danh mục mã tài khoản Thu/Chi,
  dropdown do Admin khai báo — nguyên tắc #2).
* **Task 8.6**: `CashTransactionsModule` mới — `GET/POST /cash-transactions` (sổ quỹ).
* **Task 8.7-8.8**: `apiClient.ts` mở rộng; `PaymentsPage` cập nhật + `CashAccountsPage` mới +
  `CashTransactionsPage` mới (sổ quỹ theo ngày).

### Giai đoạn 9: HR, Admin & Audit

* **Task 9.1-9.3**: Mở rộng `Employee` (`email`, `team`, `branch`, `role` enum, `accountId` nullable —
  **lưu ý: `Employee` là hồ sơ nghiệp vụ, KHÁC `Account` đăng nhập kỹ thuật**, xem
  `implementation_plan.md`); mở rộng `KPI` (`bonus`); thêm `SystemConfig`, `AuditLog`; migrate; DTO.
* **Task 9.4**: Mở rộng `EmployeesModule` — `PATCH /employees/{id}`.
* **Task 9.5**: Mở rộng `KpisModule` — thêm `POST /kpis` (contract cũ chỉ có `GET`).
* **Task 9.6**: `SystemConfigModule` mới — `GET /system-configs`, `PATCH /system-configs/{key}`
  (dropdown do Admin khai báo, vd tỷ giá, ngưỡng cảnh báo — nguyên tắc #2).
* **Task 9.7**: `AuditLogsModule` mới — `GET /audit-logs` (chỉ tài khoản admin xem, theo
  `@RequirePermission("audit-logs", "view")`); các Service ở Giai đoạn 4-9 khi sửa dữ liệu quan trọng
  (status hợp đồng, tồn kho, tài chính) phải tự ghi 1 dòng `AuditLog` — nguyên tắc #5 "mọi thay đổi
  phải có log".
* **Task 9.8-9.10**: `apiClient.ts` mở rộng; `EmployeesPage` cập nhật + `KPIsPage` mới +
  `SystemConfigsPage` mới + `AuditLogsPage` mới (chỉ admin); tích hợp toàn bộ trang Phase 2 (Giai
  đoạn 4-9) vào Sidebar Navigation, theo `ui-ux-pro-max`.

### Rủi ro & lưu ý khi `/build`

| Rủi ro | Mức độ | Cách giảm thiểu |
| :-- | :-- | :-- |
| Migration Prisma riêng lẻ theo từng Giai đoạn (6 lần `migrate dev`) dễ xung đột nếu build song song nhiều Giai đoạn | Trung bình | Build tuần tự từng Giai đoạn trọn vẹn (schema→DTO→backend→frontend→test) trước khi sang Giai đoạn kế, đúng "Checkpoint" đã ghi ở bảng trên |
| `OrdersModule`/`ShipmentsModule`/`PaymentsModule` đều có state-machine rule phải enforce ở Service (không chỉ DTO) — dễ bỏ sót khi build nhanh | Cao | `/review` sau mỗi Giai đoạn phải test rõ ràng case "cố tình vi phạm rule" (vd PATCH order đã delivered, PATCH shipment sang delivered không có tracking) — không chỉ test happy path |
| `InventoryTransactionsModule` phải đồng bộ đúng với `Inventory` (Phase 1) trong cùng transaction DB — dễ lệch nếu tách 2 lệnh update riêng | Cao | Dùng `prisma.$transaction` bao cả 2 thao tác (ghi `InventoryTransaction` + update `Inventory.quantity`), test có concurrent request để xác nhận không lệch |
| 20 module backend mới → 20 tài khoản mặc định mới cần thêm vào `prisma/seed-accounts.ts` | Thấp | Đã ghi rõ trong `skills/build/auth-and-permissions/SKILL.md` mục 4 — chỉ cần thêm dòng vào `FUNCTIONAL_ACCOUNTS`, chạy lại `db:seed:accounts` (idempotent) |
| Row-level filter mới ở `LeadsService.list()`/`OrdersService.list()` (Giai đoạn 10.5/12.5) có thể vô tình lọc luôn cả 2 tài khoản module mặc định `lead`/`order` (seed sẵn từ Phase 2, không link Employee nào) nếu điều kiện "chỉ lọc khi link Employee role=Sale" viết sai | Cao | Viết unit test riêng cho đúng 2 case: (1) tài khoản `lead`/`order`/admin → thấy toàn bộ danh sách như cũ; (2) tài khoản link Employee role=Sale → chỉ thấy đúng phần của mình. Test case (1) là regression test, PHẢI pass trước khi coi Giai đoạn 10/12 xong |
| `prisma/seed.ts` (dữ liệu mẫu 5 dòng/bảng, viết ở phiên chạy thử `run_locallhost.ps1` trước `/spec` này) dùng `Customer.customerType` giá trị `"returning"`/`"vip"` — không khớp enum `[new, old]` trong contract | Thấp | Sửa lại seed mẫu về đúng 2 giá trị `new`/`old` khi build Giai đoạn 12 (tiện thể, cùng lúc sửa logic upsert Customer) |
| 19 module ở Giai đoạn 13 tuy độc lập nhưng đều sửa cùng nhóm file `*.service.ts` — nếu build song song nhiều task 13.x bằng nhiều agent/fork cùng lúc dễ xung đột merge nếu 2 task lỡ chạm cùng 1 file | Thấp | Đã chia 13.1-13.6 theo đúng ranh giới module (không module nào xuất hiện ở 2 task) — chỉ cần không gộp thêm module ngoài danh sách đã liệt kê ở mỗi task |

## Chi tiết Phase 3 (`/plan` ở Phiên #31, dựa trên `implementation_plan.md`/`api-contract.openapi.yaml` Phiên #30)

Không có Giai đoạn nào cho đăng nhập/phân quyền/Quản lý tài khoản (baseline có sẵn). Cả 6 Giai đoạn
dưới đây sửa/mở rộng module **đã build ở Phase 2** — không tạo module mới nào, chỉ additive.

### Giai đoạn 10: Lead — Mã Lead, field mới, round-robin, lọc theo Sale (vấn đề #1, #2, #3)

* **Task 10.1-10.3**: Thêm field vào `schema.prisma` (`Lead.code`/`productInterest`/`threadId`,
  `LeadLog.fieldChanged`/`oldValue`/`newValue`, nới `toStatus` sang nullable); migrate; DTO.
* **Task 10.4**: `LeadsService.create()` sinh `code` (4 ký tự `[A-Z0-9]`, retry khi trùng unique) và tự
  gán `assignedTo` theo round-robin (`count(Lead) % số Employee role=Sale, status=active`, sắp xếp ổn
  định theo `createdAt asc, id asc`) khi client không truyền. `LeadsService.update()` mở rộng: ghi
  `LeadLog` (fieldChanged=assignedTo) **và** `auditLogsService.record()` khi đổi `assignedTo` — hiện
  tại KHÔNG ghi gì cả khi chỉ đổi field này (lỗi người dùng báo ở vấn đề #7 phần đầu).
* **Task 10.5**: `LeadsService.list()` — nếu tài khoản đăng nhập link `Employee` (`accountId`) có
  `role=Sale` và `Account.isAdmin=false`, tự `WHERE assignedTo = employee.id`; ngược lại giữ nguyên
  (thấy toàn bộ). Thêm query param `status` (dropdown "Chọn mã Lead" cần lọc `status=converted`) và
  `assignedTo=me`.
* **Task 10.6**: `apiClient.ts` gọi API mới; `LeadsPage` — form "Thêm Lead mới" thêm 2 field, bảng
  "Danh sách Leads" thêm 3 cột (Mã Lead, Sản phẩm quan tâm, Mã hội thoại), xác nhận cột "Sale phụ
  trách" hiển thị đúng tên (không chỉ UUID — join `Employee.name` ở FE hoặc BE tuỳ thuận tiện).

### Giai đoạn 11: Account — hiển thị tên nhân viên (vấn đề #4, phần hiển thị)

* **Task 11.1**: `AccountsService.list()`/`getById()` — trả thêm `employeeName` (query 1 lần
  `Employee.findMany({accountId: {in: accountIds}})`, map theo `accountId`, KHÔNG N+1 query mỗi
  account). Phần phân quyền row-level (Sale chỉ thấy Lead/Order của mình) đã nằm ở Task 10.5/12.5 —
  không lặp lại ở đây.
* **Task 11.2**: `AccountsPage` — thêm cột "Tên nhân viên" vào bảng Danh sách tài khoản.

### Giai đoạn 12: Order — chọn Lead, tạo đơn kèm sản phẩm, tự upsert Customer (vấn đề #5, #6)

* **Task 12.1-12.3**: Thêm field vào `schema.prisma` (`Order.leadId`/`assignedTo`/`shippingAddress`/
  `shippingPhone`/`note`, `OrderItem.discountPercent`); migrate; DTO (`CreateOrderInput` mở rộng theo
  đúng shape đã viết trong `api-contract.openapi.yaml`).
* **Task 12.4**: `OrdersService.create()` viết lại theo luồng mới, toàn bộ trong 1 `$transaction`:
  1. Nếu có `shippingPhone` → `customer.upsert` theo `phone` (chưa có → tạo `customerType=new`; đã có
     → cập nhật `customerType=old` + đồng bộ `name`/`address` mới nhất).
  2. Tạo `Order` (`customerId` = customer vừa upsert, `leadId`, `assignedTo` mặc định = chính Sale
     đang gọi API nếu không truyền, `shippingAddress`/`shippingPhone`/`note`).
  3. Tạo 1 `OrderItem` đầu tiên nếu có `productId`/`quantity`/`unitPrice` trong request.
  4. Ghi `auditLogsService.record()` cho `Order` (bảng ở Giai đoạn 13 chỉ liệt kê module CHƯA có gọi
     — `orders.create` nằm trong phạm vi Task này, không lặp lại ở Giai đoạn 13).
* **Task 12.5**: `OrdersService.list()` — cùng cơ chế row-level filter với Task 10.5 (theo
  `assignedTo`), nhúng `items: OrderItem[]` trong mỗi Order trả về (`include`, tránh N+1).
* **Task 12.6**: `apiClient.ts` gọi API mới; `OrdersPage` — form "Tạo hợp đồng" đổi "Chọn khách hàng"
  thành "Chọn mã Lead" (dropdown gọi `GET /leads?status=converted&assignedTo=me`, luôn có lựa chọn
  trống = không gắn Lead), thêm field Tên khách hàng/Chọn sản phẩm/Số lượng/Giá bán/%KM/Địa chỉ/SĐT/
  Ghi chú (Thành tiền tự tính, hiển thị read-only); bảng "Danh sách Hợp đồng" thêm cột "Sale phụ
  trách" + các cột sản phẩm/số lượng/giá/%KM/địa chỉ/SĐT/ghi chú (đọc từ `items[0]` + field mới).

### Giai đoạn 13: Audit log phủ toàn bộ module (vấn đề #7)

Mỗi Task chỉ thêm 1-3 dòng gọi `this.auditLogsService.record({...}, tx)` vào đúng method
`create`/`update`/`delete` hiện có của module đó (copy pattern từ `orders.service.ts` — bọc trong
`$transaction`, chỉ ghi khi field thực sự đổi giá trị lúc update). KHÔNG đổi kiến trúc, KHÔNG thêm
Prisma middleware — xem lý do ở `implementation_plan.md` mục "Quyết định thiết kế" #8.

* **Task 13.1**: `CampaignsService` (create+update), `CustomersService` (create+update),
  `MarketingReportsService` (create).
* **Task 13.2**: `SaleReportsService` (create — dù đã deprecated, vẫn ghi log nếu còn ai gọi),
  `ShipmentsService` (create+update), `TrackingLogsService`/method tạo tracking log (create).
* **Task 13.3**: `WarehousesService` (create), `CskhLogsService` (create).
* **Task 13.4**: `ProductsService` (create+update), `ProductPerformanceService` (create),
  `FeedbacksService` (create).
* **Task 13.5**: `CashAccountsService` (create), `CashTransactionsService` (create), `KpisService`
  (create).
* **Task 13.6**: `AccountsService` (create/update/delete), `setAccountPermissions` (PUT).
* **Task 13.7**: Không sửa code trừ khi phát hiện thiếu — đăng nhập, thực hiện vài thao tác thật ở
  từng trang đã sửa (đổi `assignedTo` 1 Lead, tạo 1 Order, sửa 1 Campaign...), mở `/audit-logs`, xác
  nhận từng thao tác đều xuất hiện đúng `tableName`/`fieldChanged`/`oldValue`/`newValue`.

### Giai đoạn 14: Sale Report tự động (vấn đề #8)

* **Task 14.1**: `SaleReportsService.getAuto(date)` — 1 query tổng hợp (hoặc vài query nhỏ gộp bằng
  `Promise.all`) theo đúng công thức trong `implementation_plan.md` mục "Công thức tính
  SaleReportAuto", trả về 1 dòng/Employee(role=Sale). `SaleReportsController` thêm
  `GET /sale-reports/auto?date=`.
* **Task 14.2**: DTO shared-types `SaleReportAuto`.
* **Task 14.3**: `apiClient.ts` gọi endpoint mới; `SaleReportsPage` đổi nguồn dữ liệu, bỏ nút/form
  "Nhập báo cáo" (endpoint cũ giữ ở BE nhưng FE không gọi nữa).

### Giai đoạn 15: Đổi thương hiệu — logo + bảng màu (vấn đề #9)

* **Task 15.1**: Chạy `ui-ux-pro-max` — xác nhận/tinh chỉnh token màu đề xuất
  (`brand-600: #428000`, `brand-700: #356600`, `brand-300: #84A066`, xem trích xuất màu thật ở
  `implementation_plan.md`), thêm file logo vào `apps/frontend/public/` (hoặc `src/assets/`).
* **Task 15.2**: Cập nhật `src/styles/index.css` (khối `@theme` Tailwind v4, token `--color-brand-*`),
  `Layout.tsx` (hiện logo ảnh thay vì text "Sàn Gỗ ERP"), `index.html`/`<title>` nếu cần đổi tên hiển
  thị theo thương hiệu mới.

### Rủi ro & lưu ý riêng cho Phase 3

Xem bảng "Rủi ro & lưu ý khi `/build`" ở trên — đã bổ sung 3 dòng rủi ro riêng cho Phase 3 (row-level
filter làm hỏng 2 tài khoản module mặc định, `customerType` seed sai enum, xung đột merge khi build
song song Giai đoạn 13).
