import { IsIn, IsISO8601, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from "class-validator";

const CASH_TRANSACTION_TYPES = ["income", "expense"] as const;

export class CreateCashTransactionDto {
  @IsString()
  @IsNotEmpty()
  cashAccountId!: string;

  @IsIn(CASH_TRANSACTION_TYPES)
  type!: string;

  @IsOptional()
  @IsString()
  branch?: string;

  @IsOptional()
  @IsString()
  market?: string;

  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsNumber()
  @Min(0)
  amount!: number;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  evidenceUrl?: string;

  @IsISO8601()
  transactionDate!: string;
}
