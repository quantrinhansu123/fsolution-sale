# Deploy `fsolution` lên hosting cPanel — giá trị cụ thể

Quy trình chuẩn: **`skills/ship/cpanel-deploy/SKILL.md`** (Prisma 6 queryCompiler + bundle build sẵn).
File này ghi các giá trị cụ thể của `fsolution`. **Chưa deploy** — điền giá trị thật khi triển khai.

## Cổng local (tham chiếu)

| | |
| :-- | :-- |
| Backend HTTP | `3003` |
| Frontend (Vite) | `5176` |
| Postgres portable | `5436` — DB `fsolution` |

## Giá trị cần điền khi deploy

| | |
| :-- | :-- |
| Domain / subpath app | `<https://…>` (vd `https://<domain>/` hoặc `https://<domain>/quan-tri/`) |
| Backend API | `https://api.<domain>/api/v1/…` |
| Document root subdomain `api` | `/home/<cpuser>/<slug>-api` — **RIÊNG, KHÔNG phải `/public_html`** (nếu trùng, Passenger ghi `.htaccess` đè trang gốc) |
| Application root (Node.js App) | `<slug>-api` → `/home/<cpuser>/<slug>-api` |
| Application startup file | `dist/main.js` |
| Node version | 20.x |
| Frontend đặt tại | `/home/<cpuser>/public_html/` (domain riêng) hoặc `public_html/<subpath>/` |
| Database | Supabase — project `<ref>`, **Shared/Session pooler port 5432** |

## Environment variables (Node.js App)

```
NODE_ENV=production
PORT=3003
DATABASE_URL=postgresql://postgres.<ref>:<MẬT_KHẨU_SUPABASE>@aws-0-<region>.pooler.supabase.com:5432/postgres
JWT_SECRET=<chuỗi ngẫu nhiên ≥32 ký tự riêng cho production>
FRONTEND_URL=https://<domain>
PRISMA_CLIENT_ENGINE_TYPE=client
```
> `DATABASE_URL` **KHÔNG** có `?sslmode=require` (pg mới coi là verify-full → fail cert self-signed
> của Supabase pooler; `PrismaService` + `migrate.js` tự cấu hình SSL không verify).

## Nếu deploy vào thư mục con (subpath)

Frontend `fsolution` hiện build với `base: "/"` cố định. Nếu đặt app ở `<domain>/quan-tri/`
(không phải domain/subdomain riêng), trước tiên thêm hỗ trợ subpath cho frontend giống `sancaocap`:
- `vite.config.mts`: `base: process.env.VITE_BASE_PATH || "/"`
- React Router: `basename={import.meta.env.BASE_URL}`
- Thêm `public/.htaccess` SPA fallback theo base đó
- Build: `VITE_API_BASE_URL=https://api.<domain>/api/v1  VITE_BASE_PATH=/quan-tri/  npm run build`
- `public_html/.htaccess` (ngoài `# BEGIN WordPress` nếu có): `RewriteRule ^quan-tri($|/) - [L]`

Nếu dùng domain/subdomain riêng cho app thì bỏ qua mục này, build thẳng
`VITE_API_BASE_URL=https://api.<domain>/api/v1 npm run build`.

## Trạng thái repo (cập nhật 2026-09-04)

- **`apps/backend` đã lên Prisma 6.19** — `engineType="client"`, `@prisma/adapter-pg` + `pg`,
  bỏ custom `output`. `PrismaService` / `prisma/_seed-client.ts` / `test/prisma-test-client.ts`
  dùng `buildPgConfig` (ssl tắt cho Postgres localhost, bật không-verify cho Supabase/VPS).
  Thêm `prisma/migrate.js` (bộ chạy migration bằng `pg`) + script `db:migrate:pg`.
- Test suite pass toàn bộ trên nền mới: **116 unit + 62 e2e**.
- **Frontend chưa có hỗ trợ subpath** — xem mục trên nếu cần.
