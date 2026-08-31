# Supabase deployment

Khi triển khai qua Supabase (thay vì VPS tự host), đặt config/migration đặc thù Supabase (`supabase/config.toml`, edge functions nếu có) tại đây. `DATABASE_URL` trong `apps/backend/.env` trỏ tới connection string của Supabase; `prisma/schema.prisma` không đổi.

> Trạng thái: chưa triển khai — sẽ bổ sung khi `/ship` chọn nhánh Supabase.
