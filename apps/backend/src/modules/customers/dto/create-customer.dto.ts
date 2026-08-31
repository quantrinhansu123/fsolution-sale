import { IsIn, IsNotEmpty, IsOptional, IsString } from "class-validator";

const CUSTOMER_TYPES = ["new", "old"] as const;

export class CreateCustomerDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  phone!: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsIn(CUSTOMER_TYPES)
  customerType?: string;
}
