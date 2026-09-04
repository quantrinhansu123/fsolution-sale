/**
 * Bộ chạy migration bằng `pg` (JS thuần) — thay cho `prisma migrate deploy` khi deploy lên
 * shared hosting CloudLinux/CageFS (schema-engine Rust của Prisma bị chặn).
 * Ở localhost vẫn dùng `prisma migrate dev` như thường; script này chỉ dùng ở bước deploy.
 *
 * Đọc prisma/migrations/<ts>_<name>/migration.sql theo thứ tự, bỏ qua migration đã có trong
 * bảng _prisma_migrations, áp phần còn lại trong 1 transaction mỗi cái, rồi ghi lại vào
 * _prisma_migrations đúng định dạng Prisma dùng.
 *
 * Chạy:  node prisma/migrate.js       (cần env DATABASE_URL)
 * Xem skills/ship/cpanel-deploy/SKILL.md.
 */
const { Client } = require("pg");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const MIGRATIONS_DIR = path.join(__dirname, "migrations");

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("[migrate] Thiếu env DATABASE_URL");
    process.exit(1);
  }

  const url = process.env.DATABASE_URL
    .replace(/([?&])sslmode=[^&]*/gi, "$1")
    .replace(/[?&]+$/g, "")
    .replace(/\?&/g, "?");
  const client = new Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  await client.query(`
    CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
      "id"                    VARCHAR(36) PRIMARY KEY NOT NULL,
      "checksum"              VARCHAR(64) NOT NULL,
      "finished_at"           TIMESTAMPTZ,
      "migration_name"        VARCHAR(255) NOT NULL,
      "logs"                  TEXT,
      "rolled_back_at"        TIMESTAMPTZ,
      "started_at"            TIMESTAMPTZ NOT NULL DEFAULT now(),
      "applied_steps_count"   INTEGER NOT NULL DEFAULT 0
    );
  `);

  const appliedRows = await client.query(
    `SELECT migration_name FROM "_prisma_migrations" WHERE rolled_back_at IS NULL`
  );
  const applied = new Set(appliedRows.rows.map((r) => r.migration_name));

  const dirs = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((d) => {
      try {
        return fs.statSync(path.join(MIGRATIONS_DIR, d)).isDirectory();
      } catch {
        return false;
      }
    })
    .sort();

  let count = 0;
  for (const dir of dirs) {
    if (applied.has(dir)) {
      console.log(`= ${dir}  (đã áp dụng)`);
      continue;
    }
    const sqlPath = path.join(MIGRATIONS_DIR, dir, "migration.sql");
    if (!fs.existsSync(sqlPath)) {
      console.log(`? ${dir}  (không có migration.sql — bỏ qua)`);
      continue;
    }
    const sql = fs.readFileSync(sqlPath, "utf8");
    const checksum = crypto.createHash("sha256").update(sql, "utf8").digest("hex");

    process.stdout.write(`+ ${dir}  — đang áp dụng... `);
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query(
        `INSERT INTO "_prisma_migrations"
           (id, checksum, finished_at, migration_name, started_at, applied_steps_count)
         VALUES ($1, $2, now(), $3, now(), 1)`,
        [crypto.randomUUID(), checksum, dir]
      );
      await client.query("COMMIT");
      console.log("OK");
      count++;
    } catch (e) {
      await client.query("ROLLBACK").catch(() => {});
      console.log("LỖI");
      console.error(`\n[migrate] Lỗi ở migration "${dir}":\n${e.message}\n`);
      await client.end();
      process.exit(1);
    }
  }

  console.log(
    count === 0
      ? "=== Không có migration mới. DB đã đồng bộ. ==="
      : `=== Đã áp dụng ${count} migration. DB đã đồng bộ. ===`
  );
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
