import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, Product } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { diffFields } from "../../common/utils/audit-diff";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";

function isUniqueConstraintError(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
}

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService
  ) {}

  list(): Promise<Product[]> {
    return this.prisma.product.findMany();
  }

  async create(dto: CreateProductDto): Promise<Product> {
    try {
      return await this.prisma.product.create({ data: dto });
    } catch (err) {
      if (isUniqueConstraintError(err)) throw new ConflictException("Mã SKU đã tồn tại");
      throw err;
    }
  }

  async update(id: string, dto: UpdateProductDto, changedBy?: string): Promise<Product> {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException("Không tìm thấy sản phẩm");

    // Mới (Phase 3) — nguyên tắc #5: mọi thay đổi phải có log, cùng transaction với update.
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.product.update({ where: { id }, data: dto });

      for (const change of diffFields(product, dto as unknown as Record<string, unknown>)) {
        await this.auditLogsService.record(
          { tableName: "Product", recordId: id, fieldChanged: change.field, oldValue: change.oldValue, newValue: change.newValue, changedBy },
          tx
        );
      }

      return updated;
    });
  }
}
