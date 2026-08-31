import { Body, Controller, Get, Param, Patch } from "@nestjs/common";
import { SystemConfigService } from "./system-config.service";
import { UpdateSystemConfigDto } from "./dto/update-system-config.dto";
import { RequirePermission } from "../../common/decorators/require-permission.decorator";
import { CurrentAccount } from "../../common/decorators/current-account.decorator";
import { JwtPayload } from "../../common/types/jwt-payload";

const MODULE = "system-config";

@Controller("system-configs")
export class SystemConfigController {
  constructor(private readonly systemConfigService: SystemConfigService) {}

  @Get()
  @RequirePermission(MODULE, "view")
  list() {
    return this.systemConfigService.list();
  }

  @Patch(":key")
  @RequirePermission(MODULE, "edit")
  update(@Param("key") key: string, @Body() dto: UpdateSystemConfigDto, @CurrentAccount() account: JwtPayload) {
    return this.systemConfigService.update(key, dto, account.sub);
  }
}
