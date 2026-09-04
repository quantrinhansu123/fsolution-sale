// Client dùng chung cho các script seed. Prisma 6 engineType="client" bắt buộc truyền driver
// adapter khi khởi tạo PrismaClient — kể cả ở localhost. Khi đóng gói bundle deploy cPanel,
// seed .ts được biên dịch sang .js (server không có ts-node) và vẫn dùng đúng client này.
// Xem skills/ship/cpanel-deploy/SKILL.md.
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const raw = process.env.DATABASE_URL ?? "";
const url = raw
  .replace(/([?&])sslmode=[^&]*/gi, "$1")
  .replace(/[?&]+$/g, "")
  .replace(/\?&/g, "?");
const disableSsl =
  /[?&]sslmode=disable/i.test(raw) || /@(localhost|127\.0\.0\.1|\[::1\])[:/]/i.test(url);

export const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: url,
    ssl: disableSsl ? false : { rejectUnauthorized: false },
  }),
});
