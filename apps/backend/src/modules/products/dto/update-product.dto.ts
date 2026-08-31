import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from "class-validator";
import { PRODUCT_UNITS } from "../product-units";

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsIn(PRODUCT_UNITS)
  unit?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsString()
  category?: string;
}
