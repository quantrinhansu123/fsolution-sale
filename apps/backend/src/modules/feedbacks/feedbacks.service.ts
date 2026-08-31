import { Injectable } from "@nestjs/common";
import { Feedback } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateFeedbackDto } from "./dto/create-feedback.dto";

@Injectable()
export class FeedbacksService {
  constructor(private readonly prisma: PrismaService) {}

  list(): Promise<Feedback[]> {
    return this.prisma.feedback.findMany();
  }

  create(dto: CreateFeedbackDto): Promise<Feedback> {
    return this.prisma.feedback.create({ data: dto });
  }
}
