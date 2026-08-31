import { Controller, Get } from "@nestjs/common";
import { AppService } from "./app.service";
import { Public } from "./common/decorators/public.decorator";

@Controller("health")
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  getHealth() {
    return this.appService.getHealth();
  }
}
