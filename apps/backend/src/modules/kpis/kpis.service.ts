import { Injectable, NotFoundException } from "@nestjs/common";
import { KPI } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateKpiDto } from "./dto/create-kpi.dto";

@Injectable()
export class KpisService {
  constructor(private readonly prisma: PrismaService) {}

  list(): Promise<KPI[]> {
    return this.prisma.kPI.findMany();
  }

  async create(dto: CreateKpiDto): Promise<KPI> {
    const employee = await this.prisma.employee.findUnique({ where: { id: dto.employeeId } });
    if (!employee) throw new NotFoundException("Không tìm thấy nhân sự");

    return this.prisma.kPI.create({ data: dto });
  }
}
