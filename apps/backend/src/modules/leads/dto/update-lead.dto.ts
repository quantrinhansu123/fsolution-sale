import { IsIn, IsOptional, IsString, ValidateIf } from "class-validator";

const LEAD_STATUSES = ["new", "contacted", "qualified", "converted", "lost"] as const;

export class UpdateLeadDto {
  @IsOptional()
  @IsIn(LEAD_STATUSES)
  status?: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  assignedTo?: string | null;

  @IsOptional()
  @IsString()
  note?: string;
}
