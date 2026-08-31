import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from "class-validator";
import { PRODUCT_UNITS } from "../product-units";

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  sku!: string;

  @IsIn(PRODUCT_UNITS)
  unit!: string;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsOptional()
  @IsString()
  category?: string;
}
