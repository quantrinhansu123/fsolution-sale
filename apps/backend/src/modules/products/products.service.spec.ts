import { randomUUID } from "crypto";
import { ConflictException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { ProductsService } from "./products.service";

describe("ProductsService", () => {
  const prisma = new PrismaService();
  const service = new ProductsService(prisma, new AuditLogsService(prisma));

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  function uniqueSku() {
    return `SKU-${randomUUID().slice(0, 8)}`;
  }

  it("create() thêm sản phẩm mới", async () => {
    const sku = uniqueSku();
    const created = await service.create({ name: "Sàn gỗ Oak 12mm", sku, unit: "m2", price: 250000 });
    expect(created.sku).toBe(sku);
    expect(created.price).toBe(250000);
  });

  it("create() trùng sku ném ConflictException", async () => {
    const sku = uniqueSku();
    await service.create({ name: "A", sku, unit: "cái", price: 100000 });
    await expect(service.create({ name: "B", sku, unit: "cái", price: 200000 })).rejects.toThrow(ConflictException);
  });

  it("update() sửa giá/danh mục thành công", async () => {
    const created = await service.create({ name: "Sàn nhựa SPC", sku: uniqueSku(), unit: "m2", price: 150000 });
    const updated = await service.update(created.id, { price: 180000, category: "san-nhua" });
    expect(updated.price).toBe(180000);
    expect(updated.category).toBe("san-nhua");
  });

  it("update() ném NotFoundException khi id không tồn tại", async () => {
    await expect(service.update(randomUUID(), { price: 1 })).rejects.toThrow(NotFoundException);
  });

  it("update() tự ghi AuditLog cho từng field thay đổi (mới Phase 3)", async () => {
    const created = await service.create({ name: "Nẹp T", sku: uniqueSku(), unit: "thanh", price: 45000 });
    const changedBy = randomUUID();
    await service.update(created.id, { price: 50000 }, changedBy);

    const logs = await prisma.auditLog.findMany({ where: { tableName: "Product", recordId: created.id } });
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({ fieldChanged: "price", oldValue: "45000", newValue: "50000", changedBy });
  });
});
