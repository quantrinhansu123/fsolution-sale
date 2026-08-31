import { Injectable, NotFoundException } from "@nestjs/common";
import { CashTransaction } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateCashTransactionDto } from "./dto/create-cash-transaction.dto";

@Injectable()
export class CashTransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  list(): Promise<CashTransaction[]> {
    return this.prisma.cashTransaction.findMany();
  }

  async create(dto: CreateCashTransactionDto): Promise<CashTransaction> {
    const cashAccount = await this.prisma.cashAccount.findUnique({ where: { id: dto.cashAccountId } });
    if (!cashAccount) throw new NotFoundException("Không tìm thấy mã tài khoản");

    return this.prisma.cashTransaction.create({
      data: { ...dto, transactionDate: new Date(dto.transactionDate) },
    });
  }
}
