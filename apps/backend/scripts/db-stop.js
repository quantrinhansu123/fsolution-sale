const path = require("path");
const EmbeddedPostgres = require("embedded-postgres").default;

const DATA_DIR = path.join(__dirname, "..", "..", "..", "infra", "postgres", "data");
const PORT = 5436;

const pg = new EmbeddedPostgres({
  databaseDir: DATA_DIR,
  user: "postgres",
  password: "postgres",
  port: PORT,
  persistent: true,
});

pg.stop()
  .then(() => console.log("[db] Đã dừng Postgres portable."))
  .catch((err) => {
    console.error("[db] Lỗi khi dừng Postgres portable:", err);
    process.exit(1);
  });
