import { randomUUID } from "crypto";
import { NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { ProductsService } from "./products.service";
import { ProductPerformanceService } from "./product-performance.service";

describe("ProductPerformanceService", () => {
  const prisma = new PrismaService();
  const productsService = new ProductsService(prisma, new AuditLogsService(prisma));
  const service = new ProductPerformanceService(prisma);

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("create() ghi nhận kết quả test sản phẩm khi productId hợp lệ", async () => {
    const product = await productsService.create({
      name: "Sàn gỗ Test",
      sku: `SKU-${randomUUID().slice(0, 8)}`,
      unit: "m2",
      price: 300000,
    });

    const created = await service.create({ productId: product.id, stage: "GĐ1", evaluation: "win" });
    expect(created.evaluation).toBe("win");
    expect(created.productId).toBe(product.id);

    const list = await service.list();
    expect(list.some((p) => p.id === created.id)).toBe(true);
  });

  it("create() ném NotFoundException khi productId không tồn tại", async () => {
    await expect(
      service.create({ productId: randomUUID(), stage: "GĐ1", evaluation: "pending" })
    ).rejects.toThrow(NotFoundException);
  });
});
