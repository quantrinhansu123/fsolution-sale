import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from "class-validator";

const FEEDBACK_SOURCES = ["MKT", "Sale", "CSKH"] as const;

export class CreateFeedbackDto {
  @IsString()
  @IsNotEmpty()
  customerId!: string;

  @IsOptional()
  @IsString()
  orderId?: string;

  @IsIn(FEEDBACK_SOURCES)
  source!: string;

  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;
}
