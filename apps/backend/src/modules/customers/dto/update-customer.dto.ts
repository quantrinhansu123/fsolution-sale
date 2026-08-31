import { IsBoolean, IsIn, IsOptional, IsString } from "class-validator";

const CUSTOMER_TYPES = ["new", "old"] as const;

export class UpdateCustomerDto {
  @IsOptional()
  @IsString()
  name?: string;

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

  @IsOptional()
  @IsBoolean()
  blacklistStatus?: boolean;
}
