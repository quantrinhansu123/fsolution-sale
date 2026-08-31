import { IsIn, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from "class-validator";

const EVALUATIONS = ["win", "fail", "pending"] as const;

export class CreateProductPerformanceDto {
  @IsString()
  @IsNotEmpty()
  productId!: string;

  @IsString()
  @IsNotEmpty()
  stage!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  messageCount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  adCost?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  orderCount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  revenue?: number;

  @IsOptional()
  @IsNumber()
  adCostRatio?: number;

  @IsOptional()
  @IsNumber()
  conversionRate?: number;

  @IsOptional()
  @IsNumber()
  paymentRate?: number;

  @IsIn(EVALUATIONS)
  evaluation!: string;
}
