// jest `setupFiles` — chạy trong MỖI worker trước khi load test.
// Ép DATABASE_URL sang DB test riêng để `new PrismaService()` trong spec không chạm DB dev.
require("./test-db-url").loadTestEnv();
