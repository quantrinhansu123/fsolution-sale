import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Chuẩn Prisma 6 + queryCompiler + driver adapter `pg` — chạy được trên shared hosting
// CloudLinux/CageFS (không engine Rust) LẪN VPS. Xem
// skills/build/local-dev-environment/SKILL.md § 3.
//
// Bỏ mọi ?sslmode=... trong URL: `pg` mới coi sslmode=require là verify-full → fail với cert
// self-signed của Supabase pooler. Tự cấu hình ssl thay vào đó:
//  - Supabase / Postgres VPS (host công khai): ssl bật, không verify cert.
//  - Postgres portable ở localhost (dev/test): KHÔNG bật ssl (server không hỗ trợ SSL).
export function buildPgConfig() {
  const raw = process.env.DATABASE_URL ?? "";
  const url = raw
    .replace(/([?&])sslmode=[^&]*/gi, "$1")
    .replace(/[?&]+$/g, "")
    .replace(/\?&/g, "?");
  const disableSsl =
    /[?&]sslmode=disable/i.test(raw) || /@(localhost|127\.0\.0\.1|\[::1\])[:/]/i.test(url);
  return {
    connectionString: url,
    ssl: disableSsl ? false : { rejectUnauthorized: false },
    max: 5,
  };
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({ adapter: new PrismaPg(buildPgConfig()) });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
