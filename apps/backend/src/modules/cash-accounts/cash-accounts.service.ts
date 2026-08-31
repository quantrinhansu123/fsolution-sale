import { ConflictException, Injectable } from "@nestjs/common";
import { CashAccount, Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateCashAccountDto } from "./dto/create-cash-account.dto";

function isUniqueConstraintError(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
}

@Injectable()
export class CashAccountsService {
  constructor(private readonly prisma: PrismaService) {}

  list(): Promise<CashAccount[]> {
    return this.prisma.cashAccount.findMany();
  }

  async create(dto: CreateCashAccountDto): Promise<CashAccount> {
    try {
      return await this.prisma.cashAccount.create({ data: dto });
    } catch (err) {
      if (isUniqueConstraintError(err)) throw new ConflictException("Mã tài khoản đã tồn tại");
      throw err;
    }
  }
}
