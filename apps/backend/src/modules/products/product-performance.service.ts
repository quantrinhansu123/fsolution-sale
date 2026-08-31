import { Injectable, NotFoundException } from "@nestjs/common";
import { ProductPerformance } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateProductPerformanceDto } from "./dto/create-product-performance.dto";

@Injectable()
export class ProductPerformanceService {
  constructor(private readonly prisma: PrismaService) {}

  list(): Promise<ProductPerformance[]> {
    return this.prisma.productPerformance.findMany();
  }

  async create(dto: CreateProductPerformanceDto): Promise<ProductPerformance> {
    const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
    if (!product) throw new NotFoundException("Không tìm thấy sản phẩm");

    return this.prisma.productPerformance.create({ data: dto });
  }
}
