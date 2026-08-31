import { Body, Controller, Get, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { CskhLogsService } from "./cskh-logs.service";
import { CreateCskhLogDto } from "./dto/create-cskh-log.dto";
import { RequirePermission } from "../../common/decorators/require-permission.decorator";

const MODULE = "cskh-logs";

@Controller("cskh-logs")
export class CskhLogsController {
  constructor(private readonly cskhLogsService: CskhLogsService) {}

  @Get()
  @RequirePermission(MODULE, "view")
  list() {
    return this.cskhLogsService.list();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(MODULE, "edit")
  create(@Body() dto: CreateCskhLogDto) {
    return this.cskhLogsService.create(dto);
  }
}
