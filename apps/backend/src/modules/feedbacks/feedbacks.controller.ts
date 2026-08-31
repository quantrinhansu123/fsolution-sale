import { Body, Controller, Get, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { FeedbacksService } from "./feedbacks.service";
import { CreateFeedbackDto } from "./dto/create-feedback.dto";
import { RequirePermission } from "../../common/decorators/require-permission.decorator";

const MODULE = "feedbacks";

@Controller("feedbacks")
export class FeedbacksController {
  constructor(private readonly feedbacksService: FeedbacksService) {}

  @Get()
  @RequirePermission(MODULE, "view")
  list() {
    return this.feedbacksService.list();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(MODULE, "edit")
  create(@Body() dto: CreateFeedbackDto) {
    return this.feedbacksService.create(dto);
  }
}
