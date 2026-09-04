// jest `globalSetup` — chạy MỘT lần trước cả suite.
//  1. Tạo database <slug>_test trong cùng cluster Postgres portable (nếu chưa có).
//  2. Áp toàn bộ migration bằng prisma/migrate.js (pg thuần — không đụng schema-engine Rust).
//  3. TRUNCATE sạch mọi bảng nghiệp vụ → baseline rỗng, xác định cho mỗi lần chạy.
// Nhờ vậy DB dev (npm run dev) KHÔNG BAO GIỜ bị test làm bẩn, và không phụ thuộc từng spec
// nhớ tự dọn. Xem skills/build/local-dev-environment/SKILL.md § 9.
const { Client } = require("pg");
const { execFileSync } = require("child_process");
const path = require("path");
const { loadTestEnv } = require("./test-db-url");

module.exports = async () => {
  loadTestEnv();
  const url = process.env.DATABASE_URL;
  if (!url || !/_test(\?|$)/.test(url.split("/").pop())) {
    throw new Error(
      `[test] DATABASE_URL phải trỏ tới database *_test, đang là: ${url || "(trống)"}`
    );
  }

  const dbName = url.match(/\/([^/?]+)(\?|$)/)[1];
  const adminUrl = url.replace(/\/([^/?]+)(\?|$)/, "/postgres$2");

  // 1. tạo DB test nếu chưa có
  const admin = new Client({ connectionString: adminUrl, ssl: false });
  await admin.connect();
  const exists = await admin.query("SELECT 1 FROM pg_database WHERE datname = $1", [dbName]);
  if (exists.rowCount === 0) {
    await admin.query(`CREATE DATABASE "${dbName}"`);
    console.log(`[test] Đã tạo database "${dbName}".`);
  }
  await admin.end();

  // 2. áp migration
  execFileSync("node", [path.join(__dirname, "..", "prisma", "migrate.js")], {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: url },
  });

  // 3. truncate sạch
  const db = new Client({ connectionString: url, ssl: false });
  await db.connect();
  const { rows } = await db.query(
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'"
  );
  if (rows.length) {
    await db.query(
      `TRUNCATE ${rows.map((r) => `"${r.tablename}"`).join(", ")} RESTART IDENTITY CASCADE`
    );
  }
  await db.end();
  console.log(`[test] DB "${dbName}" sẵn sàng (${rows.length} bảng, đã truncate).`);
};
