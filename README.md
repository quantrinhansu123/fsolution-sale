# F-Solution — CRM/ERP cho công ty phần mềm

CRM/ERP nội bộ cho **F-Solution** — công ty phần mềm/CNTT bán sản phẩm theo **gói thuê bao**
Chạy thật trên Postgres portable, khớp `docs/api-contract.openapi.yaml`, theo `docs/design-system/MASTER.md`.

Mọi lệnh `npm run bridge` đều phải kèm `--project=fsolution` (tool không còn tự suy ra được).

## Cổng dùng

| |  | fsolution |
| :-- | :-- | :-- |
| Backend |  | **3003** |
| Frontend |  | **5176** |
| Postgres portable |  | **5436** |

## Chạy dev cục bộ

```bash
# Từ thư mục gốc repo
npm install

cp projects/fsolution/apps/backend/.env.example projects/fsolution/apps/backend/.env
cp projects/fsolution/apps/frontend/.env.example projects/fsolution/apps/frontend/.env

# Khởi động Postgres portable (embedded-postgres, không cần Docker) — dữ liệu tại
# projects/fsolution/infra/postgres/data (đã gitignore)
npm run db:start --workspace=projects/fsolution/apps/backend

# Áp dụng migration (chỉ cần lại khi đổi prisma/schema.prisma)
npx prisma migrate deploy --schema=projects/fsolution/apps/backend/prisma/schema.prisma

# Tạo tài khoản mặc định (admin + 1 tài khoản/module nghiệp vụ) — idempotent, chạy lại vô hại
npm run db:seed:accounts --workspace=projects/fsolution/apps/backend

npm run start --workspace=projects/fsolution/apps/backend    # cổng 3003
npm run dev --workspace=projects/fsolution/apps/frontend     # cổng 5176
```

Mở **http://localhost:5176** — đăng nhập bằng `admin`/`abc123` (toàn quyền) hoặc 1 trong 15 tài khoản
module mặc định (`lead`, `order`, `customer`, `product`, `payment`, ...) với mật khẩu `abc123` (mỗi
tài khoản chỉ có quyền trên đúng module cùng tên, đổi qua màn Quản lý tài khoản). Xem `skills/build/auth-and-permissions/SKILL.md` để biết quy tắc đầy
đủ — đây là baseline chung cho mọi dự án, không riêng gì `fsolution`.

### Dừng lại

```bash
npm run db:stop --workspace=projects/fsolution/apps/backend
```

**Lưu ý (đã gặp thật trong lúc build):** `@prisma/client` được hoist dùng chung ở `node_modules`
gốc giữa mọi dự án trong `projects/`. Nếu backend của `faha` đang chạy khi bạn `prisma generate`
hoặc `prisma migrate dev` cho `fsolution` (hoặc ngược lại), Windows sẽ khoá file
`query_engine-windows.dll.node` và lệnh sẽ báo lỗi `EPERM`. Dừng backend của dự án kia trước khi
chạy migration/generate.

## Xem thử dữ liệu mẫu (tuỳ chọn)

```bash
# ⚠️ PHÁ HUỶ: prisma/seed.ts gọi clearAll() — XOÁ SẠCH mọi bảng nghiệp vụ rồi seed lại
# bộ dữ liệu mẫu SaaS (8 gói phần mềm, khách hàng, hợp đồng, nhân sự...). Chỉ dùng để reset
# demo. run_locallhost.ps1 KHÔNG gọi lệnh này (chỉ seed:accounts) nên launch thường không mất dữ liệu.
npm run db:seed --workspace=projects/fsolution/apps/backend
```

## Kiểm thử

```bash
npm run test --workspace=projects/fsolution/apps/backend        # Jest — cần Postgres portable đang chạy
npm run test:e2e --workspace=projects/fsolution/apps/backend    # Supertest — cần Postgres portable đang chạy
npm run test --workspace=projects/fsolution/apps/frontend       # Vitest + RTL
```

## Đăng nhập + phân quyền

Baseline có sẵn theo `skills/build/auth-and-permissions/SKILL.md` — JWT access-token (8h, không
refresh), guard theo module (`leads`/`orders`/`customers`/`account-management`/...). Tài khoản mặc định
(mật khẩu `abc123`, tự đổi được ở "Quản lý tài khoản"):

| Tài khoản | Quyền mặc định |
| :-- | :-- |
| `admin` | Toàn quyền mọi module (xem/sửa/xoá) |
| `lead` | Toàn quyền module `leads` |
| `order` | Toàn quyền module `orders` (Hợp đồng) |
| `customer` / `product` / `payment` / ... | Toàn quyền đúng 1 module cùng tên (15 tài khoản module) |

Admin có thể cấp thêm quyền cho các tài khoản khác ở màn "Phân quyền" trong Quản lý tài khoản.

## Trạng thái hiện tại

- Backend còn lại: `GET /health`; `leads` (+`GET /leads/:id/logs`); `orders`/hợp đồng (+`items`);
  `customers`; `sale-reports` (+`/auto`); `campaigns`; `marketing-reports` (+`/auto`); `cskh-logs`;
  `products` (+`product-performance`); `feedbacks`; `payments`; `cash-accounts`; `cash-transactions`;
  `employees`; `kpis`; `system-configs`; `audit-logs` (admin); `dashboard/overview` (admin, 7 biểu đồ);
  `auth` (`login`/`me`/`change-password`); `accounts` + `accounts/:id/permissions`. Prisma + PostgreSQL portable.
- **Test: 116 unit + 62 e2e (backend) + 37 (frontend) pass.** `tsc --noEmit` sạch tất cả app,
  `vite build` OK, 11/11 migration. Xem `docs/releases/2026-08-31-khoi-tao-fsolution.md` để biết
  chi tiết `/build` + `/review` + các lỗi đã sửa.
- Docker: Dockerfile + `infra/docker-compose.yml` + `infra/vps-deploy/` kế thừa từ `sango-sannhua`
  (cổng nội bộ đã đổi 3003). **Chưa chạy `docker build` thật** — môi trường không có docker/podman/WSL.
- Rủi ro đã ghi nhận (xem release doc): schema drift 6 bảng logistics (migration còn tạo, model đã
  gỡ); `npm run db:seed` phá huỷ (`clearAll()` — công cụ reset demo, `run_locallhost.ps1` không gọi);
  kế thừa từ `sango-sannhua`: pagination, refresh token, UI self-service đổi mật khẩu.


# Chạy Localhost: Câu lệnh chạy từ PS C:\Users\theta\ai-agent-os>
powershell -ExecutionPolicy Bypass -File "C:\Users\theta\ai-agent-os\projects\fsolution\run_locallhost.ps1"
