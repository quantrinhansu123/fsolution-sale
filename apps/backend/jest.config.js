/** Unit tests only (src/**\/*.spec.ts). E2E tests run separately via `npm run test:e2e`. */
module.exports = {
  rootDir: "src",
  testEnvironment: "node",
  transform: { "^.+\\.ts$": "ts-jest" },
  testRegex: ".spec.ts$",
  moduleFileExtensions: ["js", "json", "ts"],
  // Các *.service.spec.ts kết nối thẳng vào Postgres dev dùng chung — chạy song song
  // nhiều worker khiến chúng ghi đè dữ liệu của nhau (báo cáo tự động Sale/Marketing/Lead
  // đọc nhầm dữ liệu suite khác). Ép serial để suite ổn định (giống test/jest-e2e.json).
  maxWorkers: 1,
};
