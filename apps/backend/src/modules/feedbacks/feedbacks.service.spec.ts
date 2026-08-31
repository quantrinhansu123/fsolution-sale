import { randomUUID } from "crypto";
import { PrismaService } from "../../prisma/prisma.service";
import { FeedbacksService } from "./feedbacks.service";

describe("FeedbacksService", () => {
  const prisma = new PrismaService();
  const service = new FeedbacksService(prisma);

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("create() ghi nhận phản hồi khách hàng, list() trả về đúng dòng vừa tạo", async () => {
    const created = await service.create({
      customerId: randomUUID(),
      source: "CSKH",
      content: "Hài lòng với dịch vụ",
      rating: 5,
    });
    expect(created.rating).toBe(5);

    const list = await service.list();
    expect(list.some((f) => f.id === created.id)).toBe(true);
  });
});
