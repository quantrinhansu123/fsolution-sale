import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from "@nestjs/common";
import { LeadsService } from "./leads.service";
import { CreateLeadDto } from "./dto/create-lead.dto";
import { UpdateLeadDto } from "./dto/update-lead.dto";
import { RequirePermission } from "../../common/decorators/require-permission.decorator";
import { CurrentAccount } from "../../common/decorators/current-account.decorator";
import { JwtPayload } from "../../common/types/jwt-payload";

const MODULE = "leads";

@Controller("leads")
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Get()
  @RequirePermission(MODULE, "view")
  list(
    @CurrentAccount() account: JwtPayload,
    @Query("status") status?: string,
    @Query("assignedTo") assignedTo?: string
  ) {
    return this.leadsService.list(account, { status, assignedTo });
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(MODULE, "edit")
  create(@Body() dto: CreateLeadDto) {
    return this.leadsService.create(dto);
  }

  @Patch(":id")
  @RequirePermission(MODULE, "edit")
  update(@Param("id") id: string, @Body() dto: UpdateLeadDto, @CurrentAccount() account: JwtPayload) {
    return this.leadsService.update(id, dto, account.sub);
  }

  @Get(":id/logs")
  @RequirePermission(MODULE, "view")
  getLogs(@Param("id") id: string) {
    return this.leadsService.getLogs(id);
  }
}
