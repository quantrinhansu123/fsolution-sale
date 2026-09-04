// Prisma 6 engineType="client" bắt buộc truyền driver adapter khi khởi tạo PrismaClient.
// E2E spec nào cần một client Prisma riêng (ngoài PrismaService của app) dùng factory này.
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { buildPgConfig } from "../src/prisma/prisma.service";

export function createTestPrisma(): PrismaClient {
  return new PrismaClient({ adapter: new PrismaPg(buildPgConfig()) });
}
