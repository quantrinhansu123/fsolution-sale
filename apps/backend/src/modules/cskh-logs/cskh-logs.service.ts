import { Injectable, NotFoundException } from "@nestjs/common";
import { CskhLog } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateCskhLogDto } from "./dto/create-cskh-log.dto";

@Injectable()
export class CskhLogsService {
  constructor(private readonly prisma: PrismaService) {}

  list(): Promise<CskhLog[]> {
    return this.prisma.cskhLog.findMany();
  }

  async create(dto: CreateCskhLogDto): Promise<CskhLog> {
    const order = await this.prisma.order.findUnique({ where: { id: dto.orderId } });
    if (!order) throw new NotFoundException("Không tìm thấy hợp đồng");

    const customer = await this.prisma.customer.findUnique({ where: { id: dto.customerId } });
    if (!customer) throw new NotFoundException("Không tìm thấy khách hàng");

    return this.prisma.cskhLog.create({ data: dto });
  }
}
