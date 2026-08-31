import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post } from "@nestjs/common";
import { CustomersService } from "./customers.service";
import { CreateCustomerDto } from "./dto/create-customer.dto";
import { UpdateCustomerDto } from "./dto/update-customer.dto";
import { RequirePermission } from "../../common/decorators/require-permission.decorator";
import { CurrentAccount } from "../../common/decorators/current-account.decorator";
import { JwtPayload } from "../../common/types/jwt-payload";

const MODULE = "customers";

@Controller("customers")
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @RequirePermission(MODULE, "view")
  list() {
    return this.customersService.list();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(MODULE, "edit")
  create(@Body() dto: CreateCustomerDto) {
    return this.customersService.create(dto);
  }

  @Patch(":id")
  @RequirePermission(MODULE, "edit")
  update(@Param("id") id: string, @Body() dto: UpdateCustomerDto, @CurrentAccount() account: JwtPayload) {
    return this.customersService.update(id, dto, account.sub);
  }
}
