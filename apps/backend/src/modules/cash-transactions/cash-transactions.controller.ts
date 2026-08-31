import { Body, Controller, Get, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { CashTransactionsService } from "./cash-transactions.service";
import { CreateCashTransactionDto } from "./dto/create-cash-transaction.dto";
import { RequirePermission } from "../../common/decorators/require-permission.decorator";

const MODULE = "cash-transactions";

@Controller("cash-transactions")
export class CashTransactionsController {
  constructor(private readonly cashTransactionsService: CashTransactionsService) {}

  @Get()
  @RequirePermission(MODULE, "view")
  list() {
    return this.cashTransactionsService.list();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(MODULE, "edit")
  create(@Body() dto: CreateCashTransactionDto) {
    return this.cashTransactionsService.create(dto);
  }
}
