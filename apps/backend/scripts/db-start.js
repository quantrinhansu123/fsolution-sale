const path = require("path");
const fs = require("fs");
const EmbeddedPostgres = require("embedded-postgres").default;

const DATA_DIR = path.join(__dirname, "..", "..", "..", "infra", "postgres", "data");
const PORT = 5436;

const pg = new EmbeddedPostgres({
  databaseDir: DATA_DIR,
  user: "postgres",
  password: "postgres",
  port: PORT,
  persistent: true,
  // Locale mặc định của Windows (WIN1252) không lưu được tiếng Việt có dấu —
  // ép UTF8 + locale C (không phụ thuộc locale hệ điều hành).
  initdbFlags: ["--encoding=UTF8", "--locale=C"],
});

async function main() {
  const alreadyInitialised = fs.existsSync(path.join(DATA_DIR, "PG_VERSION"));
  if (!alreadyInitialised) {
    console.log(`[db] Khởi tạo cluster Postgres portable tại ${DATA_DIR} ...`);
    await pg.initialise();
  }

  console.log(`[db] Khởi động Postgres portable trên cổng ${PORT} ...`);
  await pg.start();

  try {
    await pg.createDatabase("fsolution");
    console.log('[db] Đã tạo database "fsolution".');
  } catch (err) {
    console.log('[db] Database "fsolution" đã tồn tại, bỏ qua tạo mới.');
  }

  console.log(`[db] Sẵn sàng: postgresql://postgres:postgres@localhost:${PORT}/fsolution?schema=public`);
}

main().catch((err) => {
  console.error("[db] Lỗi khi khởi động Postgres portable:", err);
  process.exit(1);
});
