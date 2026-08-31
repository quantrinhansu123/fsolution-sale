import { Body, Controller, Get, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { CashAccountsService } from "./cash-accounts.service";
import { CreateCashAccountDto } from "./dto/create-cash-account.dto";
import { RequirePermission } from "../../common/decorators/require-permission.decorator";

const MODULE = "cash-accounts";

@Controller("cash-accounts")
export class CashAccountsController {
  constructor(private readonly cashAccountsService: CashAccountsService) {}

  @Get()
  @RequirePermission(MODULE, "view")
  list() {
    return this.cashAccountsService.list();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(MODULE, "edit")
  create(@Body() dto: CreateCashAccountDto) {
    return this.cashAccountsService.create(dto);
  }
}
