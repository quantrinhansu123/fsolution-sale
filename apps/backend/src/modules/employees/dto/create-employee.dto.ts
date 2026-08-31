import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString } from "class-validator";

const EMPLOYEE_ROLES = ["MKT", "Sale", "CS", "CSKH", "KeToan", "Admin"] as const;

export class CreateEmployeeDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  team?: string;

  @IsOptional()
  @IsString()
  branch?: string;

  @IsIn(EMPLOYEE_ROLES)
  role!: string;

  @IsOptional()
  @IsString()
  accountId?: string;
}
