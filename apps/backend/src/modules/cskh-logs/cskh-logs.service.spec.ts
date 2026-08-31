import { randomUUID } from "crypto";
import { NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CskhLogsService } from "./cskh-logs.service";

describe("CskhLogsService", () => {
  const prisma = new PrismaService();
  const service = new CskhLogsService(prisma);
  let orderId: string;
  let customerId: string;

  beforeAll(async () => {
    await prisma.$connect();
    const customer = await prisma.customer.create({
      data: { name: "KH test CSKH", phone: `09${randomUUID().slice(0, 8)}` },
    });
    customerId = customer.id;
    const order = await prisma.order.create({ data: { customerId, totalAmount: 500000 } });
    orderId = order.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("create() ghi nhận cuộc gọi CSKH, list() trả về đúng dòng vừa tạo", async () => {
    const created = await service.create({
      orderId,
      customerId,
      status: "called",
      note: "Gọi xác nhận hợp đồng",
    });
    expect(created.status).toBe("called");

    const list = await service.list();
    expect(list.some((l) => l.id === created.id)).toBe(true);
  });

  it("create() với orderId không tồn tại -> NotFoundException (nguyên tắc #2)", async () => {
    await expect(
      service.create({ orderId: randomUUID(), customerId, status: "called" })
    ).rejects.toThrow(NotFoundException);
  });

  it("create() với customerId không tồn tại -> NotFoundException (nguyên tắc #2)", async () => {
    await expect(
      service.create({ orderId, customerId: randomUUID(), status: "called" })
    ).rejects.toThrow(NotFoundException);
  });
});
