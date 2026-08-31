import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateKpiDto {
  @IsString()
  @IsNotEmpty()
  employeeId!: string;

  @IsString()
  @IsNotEmpty()
  period!: string;

  @IsNumber()
  score!: number;

  @IsOptional()
  @IsNumber()
  bonus?: number;
}
