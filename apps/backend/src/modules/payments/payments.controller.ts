import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post } from "@nestjs/common";
import { PaymentsService } from "./payments.service";
import { CreatePaymentDto } from "./dto/create-payment.dto";
import { UpdatePaymentDto } from "./dto/update-payment.dto";
import { RequirePermission } from "../../common/decorators/require-permission.decorator";
import { CurrentAccount } from "../../common/decorators/current-account.decorator";
import { JwtPayload } from "../../common/types/jwt-payload";

const MODULE = "payments";

@Controller("payments")
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  @RequirePermission(MODULE, "view")
  list() {
    return this.paymentsService.list();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(MODULE, "edit")
  create(@Body() dto: CreatePaymentDto) {
    return this.paymentsService.create(dto);
  }

  @Patch(":id")
  @RequirePermission(MODULE, "edit")
  update(@Param("id") id: string, @Body() dto: UpdatePaymentDto, @CurrentAccount() account: JwtPayload) {
    return this.paymentsService.update(id, dto, account.sub);
  }
}
