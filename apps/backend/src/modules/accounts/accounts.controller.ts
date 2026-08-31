import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseArrayPipe,
  Patch,
  Post,
  Put,
} from "@nestjs/common";
import { AccountsService } from "./accounts.service";
import { CreateAccountDto } from "./dto/create-account.dto";
import { UpdateAccountDto } from "./dto/update-account.dto";
import { PermissionInputDto } from "./dto/permission-input.dto";
import { RequirePermission } from "../../common/decorators/require-permission.decorator";
import { CurrentAccount } from "../../common/decorators/current-account.decorator";
import { JwtPayload } from "../../common/types/jwt-payload";

const MODULE = "account-management";

@Controller("accounts")
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get()
  @RequirePermission(MODULE, "view")
  list() {
    return this.accountsService.list();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(MODULE, "edit")
  create(@Body() dto: CreateAccountDto) {
    return this.accountsService.create(dto);
  }

  @Patch(":id")
  @RequirePermission(MODULE, "edit")
  update(@Param("id") id: string, @Body() dto: UpdateAccountDto, @CurrentAccount() account: JwtPayload) {
    return this.accountsService.update(id, dto, account.sub);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission(MODULE, "delete")
  remove(@Param("id") id: string, @CurrentAccount() account: JwtPayload) {
    return this.accountsService.remove(id, account.sub);
  }

  @Get(":id/permissions")
  @RequirePermission(MODULE, "view")
  getPermissions(@Param("id") id: string) {
    return this.accountsService.getPermissions(id);
  }

  @Put(":id/permissions")
  @RequirePermission(MODULE, "edit")
  setPermissions(
    @Param("id") id: string,
    @Body(new ParseArrayPipe({ items: PermissionInputDto })) items: PermissionInputDto[],
    @CurrentAccount() account: JwtPayload
  ) {
    return this.accountsService.setPermissions(id, items, account.sub);
  }
}
