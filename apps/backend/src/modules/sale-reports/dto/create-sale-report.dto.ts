import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class CreateSaleReportDto {
  @IsString()
  @IsNotEmpty()
  employeeId!: string;

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

  @IsInt()
  @Min(0)
  messageCount!: number;

  @IsInt()
  @Min(0)
  orderCount!: number;

  @IsNumber()
  @Min(0)
  revenueActual!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  orderCancelCount?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  newCustomerCount?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  oldCustomerCount?: number;
}
