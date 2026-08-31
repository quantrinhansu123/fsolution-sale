import { randomUUID } from "crypto";
import { NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { EmployeesService } from "../employees/employees.service";
import { KpisService } from "./kpis.service";

describe("KpisService", () => {
  const prisma = new PrismaService();
  const employeesService = new EmployeesService(prisma, new AuditLogsService(prisma));
  const service = new KpisService(prisma);

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("create() ghi nhận KPI khi employeeId hợp lệ", async () => {
    const employee = await employeesService.create({
      name: "Nguyen Van B",
      email: `test-${randomUUID().slice(0, 8)}@fsolution.test`,
      role: "Sale",
    });

    const created = await service.create({ employeeId: employee.id, period: "2026-08", score: 8.5 });
    expect(created.score).toBe(8.5);

    const list = await service.list();
    expect(list.some((k) => k.id === created.id)).toBe(true);
  });

  it("create() ném NotFoundException khi employeeId không tồn tại", async () => {
    await expect(service.create({ employeeId: randomUUID(), period: "2026-08", score: 5 })).rejects.toThrow(
      NotFoundException
    );
  });
});
