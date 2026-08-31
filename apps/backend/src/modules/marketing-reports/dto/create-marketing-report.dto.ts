import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class CreateMarketingReportDto {
  @IsOptional()
  @IsString()
  campaignId?: string;

  @IsString()
  @IsNotEmpty()
  date!: string;

  @IsString()
  @IsNotEmpty()
  shift!: string;

  @IsString()
  @IsNotEmpty()
  product!: string;

  @IsString()
  @IsNotEmpty()
  market!: string;

  @IsString()
  @IsNotEmpty()
  team!: string;

  @IsNumber()
  @Min(0)
  adCost!: number;

  @IsInt()
  @Min(0)
  messageCount!: number;

  @IsInt()
  @Min(0)
  orderCount!: number;

  @IsNumber()
  @Min(0)
  revenue!: number;

  @IsNumber()
  @Min(0)
  revenueActual!: number;

  @IsOptional()
  @IsString()
  warning?: string;
}
