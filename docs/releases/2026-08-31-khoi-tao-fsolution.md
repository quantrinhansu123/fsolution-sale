# Release — Khởi tạo F-Solution (fork đổi domain từ sango-sannhua) — 2026-08-31

## Bối cảnh

`fsolution` là **fork** của dự án `sango-sannhua` (Phase 3), **đổi domain nghiệp vụ** sang CRM/ERP cho
**công ty phần mềm/SaaS "F-Solution"**:

- **Bỏ 4 phân hệ** không phù hợp: Tồn kho (`inventory`), Vận đơn (`shipments`), Kho hàng
  (`warehouses`), Nhập/Xuất/Điều chỉnh (`inventory-transactions`) — module backend + trang frontend +
  route + nav + e2e spec đã gỡ.
- "Đơn hàng" → **"Hợp đồng"** (nhãn UI + message lỗi service).
- Đơn vị tính sản phẩm: `["gói", "gói hàng tháng", "gói 3 tháng", "gói 6 tháng", "gói 12 tháng",
  "gói 18 tháng", "gói 24 tháng"]` (gói thuê bao phần mềm) — thay đơn vị sàn gỗ.
- Theme: `amber` → **xanh dương** (`#2563EB`, `src/styles/index.css` khối `@theme`).
- Layout/LoginPage/HomePage viết lại (logo `F-Solution`, header/footer, màn chào).
- `prisma/seed.ts` viết lại: 8 sản phẩm phần mềm, dữ liệu mẫu theo mô hình SaaS.
- package `@fsolution/*`, DB `fsolution`, cổng **3003 / 5176 / 5436**.

Codebase gốc (auth, dashboard, 15 module còn lại, contract-first) kế thừa từ `sango-sannhua` sau
commit `27fdc7e74`.

## `/build` — dọn fork cho nhất quán + sửa lỗi (phiên này)

### Lỗi chặn đã sửa

1. **Frontend không build** — `ProductsPage.tsx` khai báo `PRODUCT_UNITS: ProductUnit[]` với các
   gói thuê bao, nhưng `packages/shared-types` `ProductUnit` vẫn là đơn vị sàn gỗ (`m2|m|thanh...`).
   `tsc --noEmit` fail 6 lỗi. Sửa: cập nhật `ProductUnit` khớp `product-units.ts`.
2. **Cổng đụng `sango-sannhua`** (3001/5174/5434). Đổi sang **3003/5176/5436** ở `.env`/`.env.example`
   (BE+FE), `vite.config.mts`, `main.ts` (CORS), `env.validation.ts`, `db-start.js`/`db-stop.js`,
   `run_locallhost.ps1`, Dockerfile/nginx.conf/docker-compose.yml, `apiClient.ts`, README.
3. **e2e spec cũ của module đã gỡ** vẫn còn — `inventory.e2e-spec.ts`, `inventory-transactions.e2e-spec.ts`,
   `shipments.e2e-spec.ts`, `warehouses.e2e-spec.ts` test endpoint 404. Xoá 4 file.
4. **3 lỗi kế thừa từ cây làm việc `sango-sannhua` lúc dở** (đã sửa ở `sango-sannhua` Phiên #35-36):
   - `DashboardService.getCashFlow()` lệch 1 ngày (`@db.Date` so mốc nửa đêm giờ VN) — copy nguyên
     `period-range.ts` + `dashboard.service.ts` đã sửa.
   - `AccountsPage.tsx` code chết `changePasswordMutation` — gỡ (endpoint `PATCH /auth/change-password`
     vẫn còn + có test).
   - `products.e2e-spec.ts` thiếu field bắt buộc `unit` — thêm `unit: "gói"` (4 chỗ).
5. **12 test frontend fail** do UI fork đổi nhưng test chưa cập nhật:
   - "Xuất file Excel" → "Xuất Excel" (6 file test)
   - `HomePage`/`App` tìm text "Backend online (Status: ok)" — giờ tách 2 span → sửa thành "Backend online"
   - `App.test` `getByText("F-Solution")`/`getByText("admin")` — render nhiều chỗ → `getAllByText`
   - `LeadsPage` label "Chọn nhân viên Marketing" → "Nhân viên Marketing"
   - `ProductsPage` fixture/select `unit: "m2"` → gói thuê bao
   - `AccountsPage` số checkbox ma trận quyền `63` (21 module) → `51` (17 module, sau khi bỏ nhóm Logistics)

### Dọn nhất quán

- `apps/backend/jest.config.js`: thêm `maxWorkers: 1` — `*.service.spec.ts` kết nối thẳng DB dev
  dùng chung, chạy song song nhiều worker gây flaky (báo cáo tự động đọc nhầm dữ liệu suite khác).
  `test/jest-e2e.json` đã có sẵn.
- `AccountsPage.tsx`: gỡ nhóm module "Logistics & Kho" (4 module không còn tồn tại) khỏi ma trận quyền.
- `apiClient.ts`: gỡ `getInventory`/`getShipments`/`createShipment`/`updateShipment`/`getTrackingLogs`/
  `getWarehouses`/`createWarehouse`/`getInventoryTransactions`/`createInventoryTransaction`/
  `getInventoryBatches` + import type tương ứng (code chết, module đã gỡ).
- Gỡ BOM (U+FEFF) đầu file: `cskh-logs.service.ts`, `cskh-logs.service.spec.ts`,
  `cash-transactions.service.spec.ts`.
- Rebrand: `main.ts` `.setTitle("F-Solution API")`, `api-contract.openapi.yaml` title, `README.md`
  (h1 + intro), `docs/implementation_plan.md` + `docs/task_breakdown.md` tiêu đề. (`MASTER.md` đã
  rebrand từ trước.) Xoá 3 release doc cũ của `sango-sannhua`. Thêm `.run-logs/` vào `.gitignore`.

## `/review` — soi thay đổi fork

- `orders.service.ts` / `cskh-logs.service.ts`: **chỉ đổi text** "đơn hàng" → "hợp đồng", không đổi
  logic. `app.module.ts`: gỡ 4 module logistics sạch (import + registration).
- **Không tìm thấy lỗi logic mới** trong phần fork.

## Verification

- `tsc --noEmit`: sạch cả 2 app. `npm run build` frontend: thành công (bundle ~670kB do `xlsx` —
  cảnh báo chunk-size, không chặn).
- Backend Jest unit: **116/116** (giảm từ 135 do gỡ 4 module). Backend e2e (`maxWorkers:1`): **62/62**
  (giảm từ 79). Frontend Vitest: **37/37** (giảm từ 44).
- `npm run bridge -- run-tests --project=fsolution`: `test.status = "pass"`.
- `npx prisma migrate deploy` (DB `fsolution` @ localhost:5436): **11/11 migration**.
- Runtime thật: backend `3003` + Postgres `5436` + frontend `5176`; `GET /api/v1/health` → 200;
  `POST /auth/login` (admin/abc123) → token; `GET /dashboard/overview` → `cost === expense` (fix #4);
  `GET /shipments` + `GET /warehouses` → **404** (đã gỡ đúng); frontend
  `<title>F-Solution — Phần mềm quản lý doanh nghiệp</title>`.
- Dọn dữ liệu test tích luỹ trong DB dev, seed lại accounts (16: admin + 15 module) + dữ liệu mẫu SaaS.

## Deferred / rủi ro đã ghi nhận (không chặn ship)

- **Schema drift**: 6 bảng logistics (`Inventory`, `Shipment`, `TrackingLog`, `Warehouse`,
  `InventoryTransaction`, `InventoryBatch`) vẫn được migration `..._add_phase2_logistics` tạo trong
  DB, nhưng model đã gỡ khỏi `schema.prisma`. `migrate deploy` + `generate` chạy bình thường; app
  không tham chiếu. **Nên** thêm 1 migration DROP các bảng này + gỡ type tương ứng trong
  `shared-types` (hiện còn `Shipment`/`Warehouse`/... không dùng — vô hại, `tsc` sạch).
- **`npm run db:seed` phá huỷ**: `prisma/seed.ts` (fork viết lại) gọi `clearAll()` xoá sạch mọi bảng
  nghiệp vụ rồi seed lại — KHÁC pattern `seedIfEmpty` an toàn của `sango-sannhua`. `run_locallhost.ps1`
  **không** gọi `db:seed` (chỉ `db:seed:accounts`) nên launch thường không mất dữ liệu. Chỉ chạy tay
  `npm run db:seed` mới wipe — coi như công cụ "reset demo data". Ghi rõ trong README.
- `docker build` thật: chưa chạy được (môi trường không có docker/podman/WSL).
- Fixture "Sàn gỗ Oak 12mm" còn trong vài `*.spec.ts` backend (dữ liệu test, không phải thương hiệu).
- Kế thừa từ `sango-sannhua`: pagination list endpoint, refresh token, UI self-service đổi mật khẩu.

## Repository & Pull Request

Repo độc lập **mới** cho `fsolution` (private, KHÔNG đẩy vào remote monorepo `faha`). PR đầu tiên từ
nhánh `init-fsolution` → `main`.

## Rollback

- **Code**: PR chưa merge — không merge là rollback. Nếu đã merge: `git revert` trên repo độc lập.
- **Database**: dự án mới, chưa có dữ liệu thật — drop DB `fsolution` + migrate lại từ đầu nếu cần.
