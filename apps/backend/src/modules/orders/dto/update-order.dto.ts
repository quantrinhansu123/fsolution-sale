import { IsIn, IsOptional } from "class-validator";

const ORDER_STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"] as const;

export class UpdateOrderDto {
  @IsOptional()
  @IsIn(ORDER_STATUSES)
  status?: string;
}
