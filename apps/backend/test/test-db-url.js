// Nạp apps/backend/.env.test và ÉP process.env theo đó (luôn ghi đè — kể cả khi shell đã
// `source .env` dev trước đó). Bảo đảm MỌI test chạy trên DB test riêng, không bao giờ chạm DB dev.
// Xem skills/build/local-dev-environment/SKILL.md § 9.
const fs = require("fs");
const path = require("path");

function loadTestEnv() {
  const envPath = path.join(__dirname, "..", ".env.test");
  const text = fs.readFileSync(envPath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    let val = m[2].trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    process.env[m[1]] = val; // ép ghi đè
  }
}

module.exports = { loadTestEnv };
