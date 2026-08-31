import { Module } from "@nestjs/common";
import { CskhLogsController } from "./cskh-logs.controller";
import { CskhLogsService } from "./cskh-logs.service";

@Module({
  controllers: [CskhLogsController],
  providers: [CskhLogsService],
})
export class CskhLogsModule {}
