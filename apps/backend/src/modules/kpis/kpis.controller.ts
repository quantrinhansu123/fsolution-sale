import { Body, Controller, Get, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { KpisService } from "./kpis.service";
import { CreateKpiDto } from "./dto/create-kpi.dto";
import { RequirePermission } from "../../common/decorators/require-permission.decorator";

const MODULE = "kpis";

@Controller("kpis")
export class KpisController {
  constructor(private readonly kpisService: KpisService) {}

  @Get()
  @RequirePermission(MODULE, "view")
  list() {
    return this.kpisService.list();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(MODULE, "edit")
  create(@Body() dto: CreateKpiDto) {
    return this.kpisService.create(dto);
  }
}
