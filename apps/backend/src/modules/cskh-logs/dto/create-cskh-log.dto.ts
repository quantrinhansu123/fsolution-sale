import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateCskhLogDto {
  @IsString()
  @IsNotEmpty()
  orderId!: string;

  @IsString()
  @IsNotEmpty()
  customerId!: string;

  @IsOptional()
  @IsString()
  staffId?: string;

  @IsString()
  @IsNotEmpty()
  status!: string;

  @IsOptional()
  @IsString()
  note?: string;
}
