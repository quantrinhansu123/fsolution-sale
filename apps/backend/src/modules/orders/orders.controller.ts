import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from "@nestjs/common";
import { OrdersService } from "./orders.service";
import { CreateOrderDto } from "./dto/create-order.dto";
import { UpdateOrderDto } from "./dto/update-order.dto";
import { CreateOrderItemDto } from "./dto/create-order-item.dto";
import { RequirePermission } from "../../common/decorators/require-permission.decorator";
import { CurrentAccount } from "../../common/decorators/current-account.decorator";
import { JwtPayload } from "../../common/types/jwt-payload";

const MODULE = "orders";

@Controller("orders")
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @RequirePermission(MODULE, "view")
  list(@CurrentAccount() account: JwtPayload, @Query("assignedTo") assignedTo?: string) {
    return this.ordersService.list(account, { assignedTo });
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(MODULE, "edit")
  create(@Body() dto: CreateOrderDto, @CurrentAccount() account: JwtPayload) {
    return this.ordersService.create(dto, account);
  }

  @Patch(":id")
  @RequirePermission(MODULE, "edit")
  update(@Param("id") id: string, @Body() dto: UpdateOrderDto, @CurrentAccount() account: JwtPayload) {
    return this.ordersService.update(id, dto, account.sub);
  }

  @Get(":id/items")
  @RequirePermission(MODULE, "view")
  getItems(@Param("id") id: string) {
    return this.ordersService.getItems(id);
  }

  @Post(":id/items")
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(MODULE, "edit")
  addItem(@Param("id") id: string, @Body() dto: CreateOrderItemDto) {
    return this.ordersService.addItem(id, dto);
  }
}
