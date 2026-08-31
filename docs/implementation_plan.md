# Implementation Plan: F-Solution — CRM/ERP công ty phần mềm

Nguồn: `C:\Users\theta\Downloads\MÔ TẢ NGHIỆP VỤ CỤ THỂ.pdf` (V3.0, 42 trang) — bản đặc tả nghiệp vụ
chi tiết cho ERP/CRM nội bộ công ty kinh doanh Sàn gỗ - Sàn nhựa (ngành Vật liệu Xây dựng & Nội thất).

## Tính năng

Xây dựng Hệ thống Quản trị ERP/CRM tổng thể, bao gồm các phân hệ cốt lõi theo đúng luồng vận hành
trong tài liệu nguồn (mục "1.1 Luồng nghiệp vụ cho các đối tượng sử dụng" và "III. CÁC HẠNG MỤC TÍNH
NĂNG"):

1. **CRM & Marketing**: phễu lead (tích hợp nguồn lead như Pancake), quản lý chiến dịch, ngân sách,
   CPL/CPA/ROAS/CPS.
2. **Bán hàng (Sale/OMS)**: tiếp nhận lead → tư vấn → tạo đơn (sản phẩm, giá, khuyến mại) → theo dõi
   tỷ lệ chốt (CR), doanh số.
3. **Kho vận (Logistics)**: xử lý đơn → đẩy vận đơn → theo dõi trạng thái giao hàng → nhập-xuất-tồn
   kho.
4. **CSKH**: chăm sóc sau bán, gọi xác nhận, upsell/cross-sell, tỷ lệ mua lại.
5. **R&D (Sản phẩm)**: test sản phẩm mới, đánh giá hiệu quả (win/fail), tiếp nhận feedback.
6. **Kế toán – Tài chính**: doanh thu, chi phí, giá vốn, công nợ, dòng tiền, đối soát bill.
7. **Nhân sự (HR)**: chấm công, lương 3P, KPI/OKR, tuyển dụng, đào tạo.
8. **Dashboard (BI) & Admin**: số liệu tổng quan cho Ban Giám đốc, cấu hình danh mục, phân quyền.

## Trạng thái hiện tại (Phase 1 — đã build, test pass, đã ship PR #1)

Đã có sẵn, **KHÔNG sửa lại contract của các entity này trong lần `/spec` này** (đã build/test/ship
thật — sửa đổi retroactive cần một `/build` riêng có kế hoạch migration, không phải việc của
`/spec`):

- **Auth & Permissions** (`Account`, `Permission`) — baseline chung mọi dự án, xem
  `skills/build/auth-and-permissions/SKILL.md`. **Lưu ý quan trọng**: đây là tài khoản ĐĂNG NHẬP kỹ
  thuật (username/password/RBAC theo module), khác với thực thể nghiệp vụ "nhân sự" (`Employee`,
  xem Phase 2 mục 9) mô tả trong tài liệu nguồn (bảng `users`: tên, email, team, branch, role
  nghiệp vụ). Hai khái niệm **không được gộp làm một** — `Employee` là hồ sơ nhân sự (dữ liệu
  nghiệp vụ HR), có thể (tuỳ chọn) liên kết tới đúng một `Account` để đăng nhập qua field
  `accountId` (nullable), nhưng bản thân `Employee` không chứa mật khẩu.
- **Lead** (`GET/POST /leads`) — phễu lead đơn giản hoá (`status`: new/contacted/qualified/
  converted/lost). Tài liệu nguồn mô tả pipeline chi tiết hơn (L0–L6: Tổng Lead → Xác định nhu cầu →
  Gửi thông tin sản phẩm → Đàm phán giá → Xử lý từ chối → Chốt đơn → Fail) — **chưa đổi enum hiện có**
  (xem "Quyết định thiết kế" bên dưới), chỉ bổ sung field/endpoint mới để hỗ trợ luồng phân bổ Sale +
  cập nhật trạng thái (additive, không phá vỡ hợp đồng cũ).
- **Order** (`GET/POST /orders`) — đơn giản hoá (`status`: pending/confirmed/shipped/delivered/
  cancelled). Tài liệu nguồn có rất nhiều field vận hành chi tiết hơn (team/ca/thị trường/tracking...)
  — bổ sung qua `OrderItem` mới + `PATCH /orders/{id}` mới (additive).
- **Inventory** (`GET /inventory`) — tồn kho hiện tại, đơn giản hoá (không phân biệt nhập/xuất/lô
  hàng). Bổ sung `Warehouse`, `InventoryTransaction`, `InventoryBatch` mới ở Phase 2 (additive, không
  đổi `Inventory` hiện có).

## Phase 2 — mở rộng theo tài liệu nghiệp vụ (mục tiêu của `/spec` lần này)

### Nguyên tắc thiết kế bắt buộc (tài liệu nguồn, mục "II. Nguyên tắc thiết kế")

1. **Order là trung tâm duy nhất** — mọi bộ phận thao tác trên cùng một hệ thống, không báo cáo/file/
   hệ thống riêng lẻ (tránh lệch số liệu, double data).
2. **Không nhập tay dữ liệu quan trọng** — sản phẩm, MKT, Sale, Page, trạng thái phải chọn từ danh
   mục do Admin khai báo (dropdown), không free-text. Áp dụng khi `/build`: các trường này dùng
   `enum` hoặc FK tới bảng danh mục (`Product`, `Employee`, warehouse...), không phải `string` tự do.
3. **Mọi trạng thái phải có rule** — ví dụ không có tracking thì không được set "Đã giao"; không có
   bill thì không được set "Đã thu tiền". `/build` phải enforce rule này ở tầng Service (validate
   trước khi update status), không chỉ dựa vào validation DTO.
4. **Tách 3 loại dữ liệu**: dữ liệu gốc (`Order`), dữ liệu vận hành (`Shipment`/`InventoryTransaction`),
   dữ liệu báo cáo (`SaleReport`/`MarketingReport` — nhập tay định kỳ, KHÔNG phải nguồn sự thật, chỉ
   để đối chiếu).
5. **Mọi thay đổi phải có log** (ai sửa / sửa gì / khi nào) — xem `AuditLog` bên dưới.
6. **Khoá sửa theo giai đoạn**: Sale được sửa đơn tự do; sau khi chia vận đơn thì hạn chế; sau khi
   giao hàng thành công thì KHOÁ hoàn toàn (không cho sửa `Order`/`OrderItem` nữa). `/build` cần một
   guard riêng kiểm tra `Order.status` trước khi cho phép `PATCH`.
7. **Dashboard/BI** — tổng hợp real-time từ toàn hệ thống, không phải nguồn dữ liệu độc lập → **để
   Phase 3**, xây dựng SAU khi các entity giao dịch (transactional) ở Phase 2 đã có dữ liệu thật để
   tổng hợp. Không tạo endpoint báo cáo/tổng hợp trong `api-contract.openapi.yaml` ở Phase 2 này để
   tránh thiết kế API "đoán trước" khi chưa có gì để tổng hợp — chỉ ghi nhận yêu cầu tại đây.

### Quyết định thiết kế (giải thích lựa chọn, để `/plan` và `/build` không phải đoán lại)

- **Không đổi enum `Lead.status`/`Order.status` hiện có** — đây là hợp đồng đã build/test/ship thật.
  Việc đổi sang pipeline L0–L6 chi tiết là một thay đổi có tính phá vỡ (breaking change) cần migration
  dữ liệu thật + sửa code đã chạy — nằm ngoài phạm vi `/spec` (chỉ viết tài liệu). Nếu muốn nâng cấp,
  cần một `/spec` + `/plan` + `/build` riêng, có kế hoạch migrate dữ liệu Lead/Order hiện có.
- **`LeadLog`/`TrackingLog`/`AuditLog` là các bảng lịch sử chỉ-thêm (append-only)** — không có
  endpoint sửa/xoá qua API, chỉ `GET` (liệt kê) + ghi tự động ở tầng Service khi entity cha thay đổi
  trạng thái. Điều này thực thi trực tiếp nguyên tắc #5 ở trên.
- **Gộp "Quản lý Thu" + "Quản lý Chi"** (2 bảng gần như giống hệt nhau trong tài liệu nguồn, trang 35-37)
  thành một entity `CashTransaction` duy nhất với field phân biệt `type: income | expense` — tránh
  trùng lặp gần như hoàn toàn 2 resource REST chỉ khác nhau 1 field, đúng nguyên tắc REST không nhân
  bản tài nguyên gần giống nhau. Danh mục "Mã tài khoản" (Thu/Chi) → entity riêng `CashAccount`.
- **Không mô hình hoá riêng các bảng báo cáo tổng hợp** (Sổ quỹ theo ngày/tháng, Báo cáo Thu-Chi theo
  Chi nhánh/Thị trường, Báo cáo Dòng tiền theo Tháng, Báo cáo KQKD theo sản phẩm — tài liệu nguồn
  trang 36-38) thành resource REST riêng ở Phase 2 — đây là **read-model/aggregation view** tính từ
  `CashTransaction`/`Order`/`OrderItem` đã có, thuộc phạm vi Phase 3 (Dashboard/BI). Tạo endpoint cho
  chúng bây giờ (khi chưa có dữ liệu giao dịch thật) là thiết kế API đoán trước, dễ sai lệch khi build
  thật.
- **`Employee` (nhân sự, nghiệp vụ) tách biệt khỏi `Account` (đăng nhập, kỹ thuật)** — xem giải thích ở
  mục "Trạng thái hiện tại" bên trên.
- **Field việt hoá trong tài liệu gốc được chuẩn hoá sang camelCase tiếng Anh** (vd `ngaydonghang` →
  `packedAt`, `ngay_chia_van_don` → `dispatchedAt`) để nhất quán với toàn bộ contract hiện có — dữ
  liệu/ý nghĩa giữ nguyên, chỉ đổi tên field.
- **Không mô hình hoá chi tiết từng loại phụ phí tài chính** (`flight_fee`, `account_rental_fee`,
  `general_fee`... trong bảng `finance_records` trang 14-15) thành field riêng lẻ — dùng
  `Payment.feeBreakdown` dạng object tự do (`Record<string, number>`) để linh hoạt, tránh phải đổi
  contract mỗi khi phát sinh loại phí mới. Nếu sau này cần chuẩn hoá chặt hơn, tách field cụ thể lúc
  đó.

### Danh sách entity mới (Phase 2) và endpoint tương ứng

Toàn bộ endpoint mới đã được thêm vào `docs/api-contract.openapi.yaml` — copy nguyên khối theo đúng
tên `module` bên dưới khi `/build` (dùng làm giá trị `@RequirePermission("<module>", ...)` theo
`skills/build/auth-and-permissions/SKILL.md`):

| # | Nhóm nghiệp vụ | Entity mới | Module (permission) | Endpoint |
| :-- | :-- | :-- | :-- | :-- |
| 1 | CRM | `LeadLog` | `leads` (con của Lead) | `GET /leads/{id}/logs` |
| 2 | CRM | — | `leads` | `PATCH /leads/{id}` (mới, cập nhật status/assignedTo) |
| 3 | Marketing | `Campaign` (mở rộng) | `campaigns` | `GET/POST/PATCH /campaigns` |
| 4 | Marketing | `MarketingReport` | `marketing-reports` | `GET/POST /marketing-reports` |
| 5 | Sales | `Customer` (mở rộng) | `customers` | `GET/POST/PATCH /customers` |
| 6 | Sales | `OrderItem` | `orders` (con của Order) | `GET/POST /orders/{id}/items` |
| 7 | Sales | — | `orders` | `PATCH /orders/{id}` (mới, cập nhật status/vận hành) |
| 8 | Sales | `SaleReport` | `sale-reports` | `GET/POST /sale-reports` |
| 9 | Logistics | `Shipment` (mở rộng) | `shipments` | `GET/POST/PATCH /shipments` |
| 10 | Logistics | `TrackingLog` | `shipments` (con của Shipment) | `GET/POST /shipments/{id}/tracking-logs` |
| 11 | Logistics/Kho | `Warehouse` | `warehouses` | `GET/POST /warehouses` |
| 12 | Logistics/Kho | `InventoryTransaction` | `inventory-transactions` | `GET/POST /inventory-transactions` |
| 13 | Logistics/Kho | `InventoryBatch` | `inventory-transactions` | `GET /inventory-batches` |
| 14 | CSKH | `CskhLog` | `cskh-logs` | `GET/POST /cskh-logs` |
| 15 | R&D | `Product` (mở rộng) | `products` | `GET/POST/PATCH /products` |
| 16 | R&D | `ProductPerformance` | `products` | `GET/POST /product-performance` |
| 17 | R&D | `Feedback` (mở rộng) | `feedbacks` | `GET/POST /feedbacks` |
| 18 | Kế toán | `Payment` (mở rộng) | `payments` | `GET/POST/PATCH /payments` |
| 19 | Kế toán | `CashAccount` | `cash-accounts` | `GET/POST /cash-accounts` |
| 20 | Kế toán | `CashTransaction` | `cash-transactions` | `GET/POST /cash-transactions` |
| 21 | HR | `Employee` (mở rộng) | `employees` | `GET/POST/PATCH /employees` |
| 22 | HR | `KPI` (mở rộng) | `kpis` | `GET/POST /kpis` |
| 23 | Admin | `SystemConfig` | `system-config` | `GET/PATCH /system-configs` |
| 24 | Toàn hệ thống | `AuditLog` | `audit-logs` (chỉ admin) | `GET /audit-logs` |

**Ghi chú cho `/build`**: mỗi module nghiệp vụ mới trong bảng trên cần 1 tài khoản mặc định
(`username`/`abc123`, số ít, khớp tên module) theo đúng `prisma/seed-accounts.ts` convention đã có —
xem `skills/build/auth-and-permissions/SKILL.md` mục 4. Không cần liệt kê việc này thành task riêng
trong `task_breakdown.md` (baseline tự động).

## Phase 3 — 9 vấn đề phát hiện khi test thực tế trên giao diện (`http://localhost:5174`)

Nguồn: người dùng tự tay dùng thử UI sau khi Phase 2 chạy được cục bộ, báo lại 9 vấn đề cụ thể (bổ
sung field, phân quyền theo dòng dữ liệu, tự động hoá, audit log, đổi thương hiệu). Đây là bổ sung/
sửa lỗi trên các entity **đã build/test/ship ở Phase 2** — áp dụng đúng nguyên tắc "Prefer Addition
Over Modification" (`skills/define/api-and-interface-design/SKILL.md`): chỉ thêm field/endpoint mới,
không đổi tên/kiểu field đã có, không xoá dữ liệu cũ.

### Quyết định thiết kế (giải thích lựa chọn, để `/plan` và `/build` không phải đoán lại)

1. **Mã Lead** (vấn đề #2): field mới `Lead.code` (string, unique, 4 ký tự `[A-Z0-9]`), sinh ngẫu
   nhiên ở tầng Service lúc `POST /leads`, retry khi trùng (xác suất trùng thấp nhưng không phải 0 —
   36^4 ≈ 1.68 triệu tổ hợp). Không cho client tự truyền `code` qua `CreateLeadInput` (luôn server-
   generated, giống quy ước `Account.passwordHash` mặc định).
2. **Round-robin Sale phụ trách lúc tạo Lead** (vấn đề #3): KHÔNG lưu con trỏ "Sale kế tiếp" riêng
   (tránh thêm bảng/field trạng thái + rủi ro lệch khi xoá/thêm nhân viên Sale giữa chừng). Thay vào
   đó tính **stateless**: lấy danh sách `Employee` có `role=Sale, status=active`, sắp xếp ổn định theo
   `createdAt asc, id asc`, chỉ số = `(SỐ LEAD HIỆN CÓ) % (SỐ SALE ĐANG ACTIVE)`. Nếu chưa có Sale nào
   active, `assignedTo` để `null` (không lỗi, Admin tự gán tay sau). Chấp nhận race hiếm khi 2 request
   tạo Lead đồng thời có thể trùng cùng 1 Sale (out of scope: hệ thống nội bộ, tải thấp) — không cần
   lock phân tán cho trường hợp này.
3. **Row-level permission cho Lead/Order theo Sale phụ trách** (vấn đề #4, #5): hệ thống phân quyền
   hiện có (`Permission.module/canView/canEdit/canDelete`) là **theo module**, không theo dòng dữ
   liệu — không đổi cơ chế đó (vẫn cần `canView=true` trên module `leads`/`orders` mới thấy trang).
   Bổ sung một tầng lọc RIÊNG, chỉ áp dụng khi tài khoản đang đăng nhập **link tới đúng 1 `Employee`
   có `role=Sale`** (qua `Employee.accountId`) **và `Account.isAdmin=false`**: `GET /leads` và
   `GET /orders` tự động `WHERE assignedTo = <employee.id của chính tài khoản đó>`. Với mọi tài khoản
   khác (`isAdmin=true`, hoặc không link Employee, hoặc Employee.role khác Sale — ví dụ tài khoản
   module dùng chung `lead`/`order` đã seed sẵn từ Phase 2) — **giữ nguyên hành vi cũ, thấy toàn bộ**.
   Đây là lựa chọn additive, không phá vỡ 20 tài khoản module mặc định đã seed.
4. **`Employee` liên kết `Account`** (vấn đề #4): quan hệ `Employee.accountId → Account.id` đã tồn tại
   từ Phase 2 (một chiều, optional). Chỉ cần **AccountProfile response thêm field phái sinh
   `employeeName`** (join ngược `Employee` có `accountId = Account.id`, không lưu trùng dữ liệu) để
   hiển thị cột "Tên nhân viên" ở `/accounts` — không đổi bảng `Account`.
5. **Hợp đồng gắn Lead, không phải chọn Customer trực tiếp** (vấn đề #6): `Order` có thêm `leadId`
   (nullable, tham chiếu lỏng tới `Lead.id` — cùng kiểu "không FK cứng" đã áp dụng cho
   `CskhLog.orderId`/`Feedback.orderId`, xem nguyên tắc đã có) và `assignedTo` (nullable, tham chiếu
   `Employee.id`, cùng ý nghĩa với `Lead.assignedTo`). Khi Sale tạo đơn: chọn 1 Lead có
   `status=converted` VÀ `assignedTo = chính Sale đó` (dropdown), hoặc bỏ trống nếu đơn không phát
   sinh từ Lead nào. **Không bắt buộc mọi Order phải có Lead** — nhiều đơn tái mua từ khách cũ không
   qua phễu Lead.
6. **Customer tự động upsert theo số điện thoại** (vấn đề #6): `POST /orders` (bản mở rộng) nhận
   `customerName`/`shippingAddress`/`shippingPhone` (không phải `customerId`). Service tự
   `findUnique({phone: shippingPhone})`: nếu CHƯA có → tạo `Customer` mới (`customerType=new`); nếu
   ĐÃ có → cập nhật `customerType=old` (đánh dấu khách quay lại) và (tuỳ chọn) đồng bộ lại `name`/
   `address` mới nhất, rồi dùng `customer.id` làm `Order.customerId` như hiện có (không đổi kiểu field
   `customerId`). Toàn bộ nằm trong 1 `$transaction` (tạo/cập nhật Customer + tạo Order + tạo
   OrderItem đầu tiên) — đúng nguyên tắc #5 (mọi thay đổi phải nhất quán, không rơi rớt nửa chừng).
7. **Sản phẩm/số lượng/giá/khuyến mại ngay lúc tạo đơn** (vấn đề #6): tái dùng `OrderItem` đã có
   (không tạo bảng mới, tránh trùng lặp dữ liệu sản phẩm-trong-đơn) — `POST /orders` (mở rộng) tạo
   Order + đúng 1 `OrderItem` trong cùng request (luồng tạo đơn đơn giản hoá theo yêu cầu, KHÔNG thay
   thế `POST /orders/{id}/items` đã có — endpoint đó vẫn dùng được để thêm item thứ 2+ sau này, ví dụ
   quà tặng kèm). Bổ sung field mới `OrderItem.discountPercent` (% khuyến mại, optional, default 0) —
   `Order.totalAmount` do FE tính sẵn gửi lên (`quantity * unitPrice * (1 - discountPercent/100)`),
   Service không tự tính lại (giữ đúng hành vi `CreateOrderInput.totalAmount` đã có từ Phase 1).
   `GET /orders` (mở rộng) nhúng kèm `items: OrderItem[]` trong response để `/orders` danh sách hiển
   thị đủ cột Sản phẩm/Số lượng/Giá bán/%KM/Thành tiền mà không cần gọi thêm request phụ mỗi dòng.
8. **Audit log phải phủ TOÀN BỘ thao tác, TOÀN BỘ bảng** (vấn đề #7): `AuditLogsService.record()` đã
   tồn tại từ Phase 2 (nhận `tx` tuỳ chọn để cùng transaction) nhưng **chỉ được gọi ở 5/24 module**
   (`orders` — chỉ `update`, `payments`, `employees`, `system-config`, `inventory-transactions`) — đây
   là lỗi thật đã xác nhận bằng cách đọc code (`grep AuditLogsService` toàn bộ `src/modules`), không
   phải giả định. **Không đổi kiến trúc sang Prisma middleware/`$use` toàn cục** (dù gọn hơn) — vì 5
   module trên đã dùng đúng pattern gọi tay trong `$transaction` và đã có test pass, đổi kiến trúc lúc
   này là refactor ngoài phạm vi yêu cầu (vi phạm "Maintain Scope Discipline"), rủi ro hồi quy code đã
   ship. Quyết định: **giữ nguyên pattern gọi tay hiện có**, bổ sung lời gọi `auditLogsService.record()`
   vào ĐÚNG các method `create`/`update`/`delete` còn thiếu ở 19 module còn lại (xem bảng "Module còn
   thiếu AuditLog" bên dưới) — `/plan` chia mỗi module thành 1 task nhỏ (thêm 1-3 dòng gọi mỗi service).
   Riêng `Lead`: bổ sung gọi cho CẢ hai trường hợp đổi `status` (đã có ở `LeadLog`, giờ thêm cả
   `AuditLog`) và đổi `assignedTo` (hiện KHÔNG ghi log ở đâu cả — lỗi cụ thể người dùng báo lại,
   mục #7 phần đầu) — xem mục 9 bên dưới.
9. **`LeadLog` phải ghi cả khi đổi Sale phụ trách, không chỉ khi đổi status** (vấn đề #7, phần đầu):
   nới lỏng `LeadLog.toStatus` từ bắt buộc sang **nullable** (loosen constraint — an toàn ngược, dữ
   liệu cũ không đổi), thêm 3 field mới optional `fieldChanged`/`oldValue`/`newValue` (cùng vocabulary
   với `AuditLog`, nhất quán cách đọc). `PATCH /leads/{id}` khi đổi `assignedTo` (có hoặc không kèm
   đổi `status`) → ghi thêm 1 dòng `LeadLog` với `fieldChanged="assignedTo"`, `oldValue`/`newValue` là
   `employeeId` cũ/mới, `toStatus=null` nếu status không đổi trong cùng lần PATCH đó.
10. **Sale Report tự động, bỏ nhập tay** (vấn đề #8): **không xoá** `SaleReport`/`POST /sale-reports`
    (dữ liệu lịch sử nhập tay Phase 2 đã có thật, xoá là mất dữ liệu — vi phạm nguyên tắc chung của dự
    án). Đánh dấu `POST /sale-reports` là **deprecated** trong contract (FE gỡ bỏ form "Nhập báo cáo",
    không gọi endpoint này nữa, nhưng BE vẫn giữ để không breaking nếu còn nơi khác gọi). Thêm entity
    **read-model mới, không lưu DB** `SaleReportAuto` + endpoint `GET /sale-reports/auto?date=YYYY-MM-DD`
    — tính real-time bằng cách join `Lead`/`LeadLog`/`Order`/`OrderItem`/`Customer` theo `date` +
    `employeeId` (`Employee.role=Sale`), xem mục "Công thức tính `SaleReportAuto`" bên dưới. Trang
    `/sale-reports` (FE) đổi nguồn dữ liệu sang endpoint mới, ẩn form nhập tay.
11. **Đổi thương hiệu (logo + bảng màu)** (vấn đề #9): không phải thay đổi contract/schema — chỉ ảnh
    hưởng `apps/frontend` (asset + CSS token) và `README.md`/`index.html` (tên hiển thị nếu cần). Đã
    trích màu thật từ file nguồn `D:\San\Python\new logo\logo01-4.png` (giải mã PNG trực tiếp, đếm tần
    suất pixel — không đoán màu bằng mắt): màu chủ đạo (chiếm ~97% vùng có màu, không tính nền trắng)
    là **`#428000`** (xanh lá rêu đậm), màu phụ (viền/lớp phủ bán trong suốt) là **`#84A066`** (xanh lá
    xám nhạt). Đề xuất token: `--color-brand-600: #428000` (primary), `--color-brand-700: #356600`
    (hover/active, tối hơn ~20%), `--color-brand-300: #84A066` (nền nhạt/badge/hover nhẹ), giữ nguyên
    neutral/text hiện có (không đủ căn cứ từ logo để đổi màu chữ). `/build` cần chạy `ui-ux-pro-max`
    trước khi sửa `src/styles/index.css` (khối `@theme`) — xem "Ngoài phạm vi" bên dưới về việc không
    tự ý đổi màu neutral/semantic (success/error) ngoài palette thương hiệu.

### Module hiện đang THIẾU lời gọi `AuditLogsService.record()` (vấn đề #7, xác nhận bằng `grep`)

`campaigns`, `customers`, `marketing-reports`, `leads` (cả create lẫn update), `sale-reports`,
`shipments` (+ `tracking-logs`), `warehouses`, `cskh-logs`, `products` (+ `product-performance`),
`feedbacks`, `cash-accounts`, `cash-transactions`, `kpis`, `accounts` (create/update/delete +
`PUT /accounts/{id}/permissions`), `orders.create` + `orders/{id}/items` (`orders.update` đã có sẵn,
chỉ thiếu `create`/`addItem`). Đã CÓ sẵn, không cần sửa: `payments`, `employees`, `system-config`,
`inventory-transactions`, `orders.update`.

### Công thức tính `SaleReportAuto` (real-time, không lưu bảng riêng)

Với mỗi `Employee (role=Sale, status=active)` và ngày `date` truyền vào query:

| Field | Cách tính |
| :-- | :-- |
| `newLeadsAssigned` | `COUNT(Lead WHERE assignedTo=employeeId AND DATE(createdAt)=date)` |
| `leadsToContacted` | `COUNT(LeadLog WHERE toStatus='contacted' AND DATE(createdAt)=date AND Lead.assignedTo=employeeId)` |
| `leadsToQualified` | tương tự, `toStatus='qualified'` |
| `leadsToConverted` | tương tự, `toStatus='converted'` |
| `leadsToLost` | tương tự, `toStatus='lost'` |
| `orderCount` | `COUNT(Order WHERE assignedTo=employeeId AND DATE(createdAt)=date)` |
| `productsSold` | `SUM(OrderItem.quantity)` của các Order ở dòng trên |
| `revenueTotal` | `SUM(Order.totalAmount)` của các Order ở dòng trên (mọi status) |
| `revenueConfirmed` | tương tự, chỉ `status IN (confirmed, shipped, delivered)` ("Đã xác nhận" trở lên) |
| `newCustomers` | `COUNT(DISTINCT Customer.id)` phát sinh từ các Order trên có `customerType='new'` |
| `returningCustomers` | tương tự, `customerType='old'` |

### Danh sách thay đổi entity + endpoint (Phase 3)

Toàn bộ đã cập nhật trong `docs/api-contract.openapi.yaml` — copy nguyên khối khi `/build`.

| # | Nhóm | Thay đổi | Module (permission) | Endpoint |
| :-- | :-- | :-- | :-- | :-- |
| 1 | CRM | `Lead` +field `code`, `productInterest`, `threadId` | `leads` | `POST /leads` (mở rộng input) |
| 2 | CRM | `Lead.assignedTo` tự gán round-robin khi tạo | `leads` | (không thêm endpoint — logic trong `POST /leads`) |
| 3 | CRM | `GET /leads` lọc theo Sale đăng nhập | `leads` | `GET /leads` (hành vi mở rộng, không đổi response shape) |
| 4 | CRM | `LeadLog` +field `fieldChanged`/`oldValue`/`newValue`, `toStatus` nullable | `leads` | `GET /leads/{id}/logs` (response mở rộng) |
| 5 | Sales | `Order` +field `leadId`, `assignedTo`, `shippingAddress`, `shippingPhone`, `note` | `orders` | `POST /orders` (mở rộng input, xem `CreateOrderInput` mới) |
| 6 | Sales | `OrderItem` +field `discountPercent` | `orders` | tạo cùng lúc với `POST /orders` |
| 7 | Sales | `GET /orders` lọc theo Sale đăng nhập, nhúng `items[]` | `orders` | `GET /orders` (hành vi + response mở rộng) |
| 8 | Sales | Danh sách Lead đã chốt của 1 Sale (cho dropdown "Chọn mã Lead") | `leads` | `GET /leads?status=converted&assignedTo=me` (query param mới) |
| 9 | Account | `employeeName` phái sinh | `account-management` | `GET /accounts` (response mở rộng) |
| 10 | Sales | Read-model báo cáo Sale tự động | `sale-reports` | `GET /sale-reports/auto?date=` (endpoint mới) |
| 11 | Toàn hệ thống | Không có endpoint mới — chỉ bổ sung lời gọi ghi log | `*` (19 module, xem bảng trên) | không đổi contract |

### Ngoài phạm vi (Phase 3)

- Đổi enum `Lead.status`/`Order.status` hiện có (giữ nguyên quyết định từ Phase 2).
- Refactor audit log sang Prisma middleware toàn cục (xem giải thích ở mục 8 "Quyết định thiết kế").
- Đổi màu neutral/semantic (success/error/warning) hoặc typography ngoài palette thương hiệu trích từ
  logo — chỉ đổi token `brand-*`.
- Tích hợp Pancake thật để tự động điền `threadId` (vẫn nhập tay/dán vào, giống `Lead.source`).
- `SaleReportAuto` hỗ trợ khoảng ngày (`from`/`to`) — Phase 3 chỉ hỗ trợ 1 ngày đơn (`date`), mở rộng
  sau nếu cần.

## Phase 4 — chưa nằm trong phạm vi contract lần này (ghi nhận để `/spec` sau)

- **Dashboard/BI** (mục 10 tài liệu nguồn): Tab Tăng trưởng / KPI / OKR, biểu đồ + bảng dữ liệu theo
  Công ty/Bộ phận/Cá nhân — cần entity giao dịch Phase 2 có dữ liệu thật trước.
- **Báo cáo tài chính tổng hợp** (Sổ quỹ ngày/tháng, Thu-Chi theo Chi nhánh/Thị trường, KQKD theo sản
  phẩm) — read-model tính từ `CashTransaction`, xem "Quyết định thiết kế" ở trên.
- **Chấm công / tuyển dụng / đào tạo chi tiết** (tài liệu nguồn mục 9, phần "Quản lý" của HR ngoài
  KPI) — tài liệu nguồn mới liệt kê mục tiêu, chưa có bảng dữ liệu cụ thể để thiết kế contract.
- **Tích hợp Pancake thật** — tài liệu nguồn tự ghi rõ "Ngoài phạm vi ở phase này (sẽ làm mock/API
  nội bộ trước)" — `Lead.source` vẫn là field string tự do, không có OAuth/webhook Pancake thật.

## Phạm vi

Backend **NestJS + Prisma + PostgreSQL**, frontend **React + Vite + Tailwind**, DTO dùng chung qua
`packages/shared-types`, auth JWT access-token-only + RBAC (đã có). Toàn bộ entity mới ở Phase 2 tuân
thủ đúng Tech Stack Contract trong `README.md` gốc.

## Ngoài phạm vi

- Tích hợp sâu API trực tiếp với Pancake, đơn vị vận chuyển hoặc ngân hàng (mock/API nội bộ trước).
- Chấm công bằng thiết bị cứng (FaceID/vân tay) — chỉ nhập tay/import file hoặc điểm danh qua web.
- Dashboard/BI, báo cáo tài chính tổng hợp, chấm công/tuyển dụng/đào tạo chi tiết — xem "Phase 4".
