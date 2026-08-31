import { IsIn, IsNotEmpty, IsOptional, IsString } from "class-validator";

const CASH_ACCOUNT_TYPES = ["income", "expense"] as const;

export class CreateCashAccountDto {
  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsIn(CASH_ACCOUNT_TYPES)
  type!: string;

  @IsOptional()
  @IsString()
  branch?: string;

  @IsOptional()
  @IsString()
  market?: string;
}
