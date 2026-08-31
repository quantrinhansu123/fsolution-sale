import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post } from "@nestjs/common";
import { ProductsService } from "./products.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { RequirePermission } from "../../common/decorators/require-permission.decorator";
import { CurrentAccount } from "../../common/decorators/current-account.decorator";
import { JwtPayload } from "../../common/types/jwt-payload";

const MODULE = "products";

@Controller("products")
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // Không gắn @RequirePermission: đây là nguồn dropdown dùng chung (vd chọn sản phẩm khi tạo Đơn
  // hàng) — mọi tài khoản đã đăng nhập cần xem được, module "products" cũng không có trong ma trận
  // quyền quản lý được ở AccountsPage.
  @Get()
  list() {
    return this.productsService.list();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(MODULE, "edit")
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Patch(":id")
  @RequirePermission(MODULE, "edit")
  update(@Param("id") id: string, @Body() dto: UpdateProductDto, @CurrentAccount() account: JwtPayload) {
    return this.productsService.update(id, dto, account.sub);
  }
}
