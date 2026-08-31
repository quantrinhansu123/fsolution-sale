import { IsIn, IsNotEmpty, IsOptional, IsString } from "class-validator";

const EMPLOYEE_ROLES = ["MKT", "Sale", "CS", "CSKH", "KeToan", "Admin"] as const;
const EMPLOYEE_STATUSES = ["active", "inactive"] as const;

export class UpdateEmployeeDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  team?: string;

  @IsOptional()
  @IsString()
  branch?: string;

  @IsOptional()
  @IsIn(EMPLOYEE_ROLES)
  role?: string;

  @IsOptional()
  @IsIn(EMPLOYEE_STATUSES)
  status?: string;

  @IsOptional()
  @IsString()
  accountId?: string | null;
}
