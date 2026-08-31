import { IsIn, IsISO8601, IsObject, IsOptional } from "class-validator";

const PAYMENT_STATUSES = ["pending", "completed", "failed"] as const;

export class UpdatePaymentDto {
  @IsOptional()
  @IsIn(PAYMENT_STATUSES)
  status?: string;

  @IsOptional()
  @IsObject()
  feeBreakdown?: Record<string, number>;

  @IsOptional()
  @IsISO8601()
  reconciledAt?: string;
}
