/** Unit tests only (src/**\/*.spec.ts). E2E tests run separately via `npm run test:e2e`.
 *  globalSetup + setupFiles: mọi test chạy trên DB test riêng (<slug>_test), TRUNCATE mỗi lần
 *  — không đụng DB dev. Xem skills/build/local-dev-environment/SKILL.md § 9. */
module.exports = {
  rootDir: "src",
  testEnvironment: "node",
  transform: { "^.+\\.ts$": "ts-jest" },
  testRegex: ".spec.ts$",
  moduleFileExtensions: ["js", "json", "ts"],
  // Chạy tuần tự: nhiều spec dùng chung DB test thật, round-robin/aggregate xuyên spec sẽ flaky
  // nếu chạy song song (xem skills/build/local-dev-environment/SKILL.md § 9).
  maxWorkers: 1,
  globalSetup: "<rootDir>/../test/global-setup.js",
  setupFiles: ["<rootDir>/../test/load-test-env.js"],
};
