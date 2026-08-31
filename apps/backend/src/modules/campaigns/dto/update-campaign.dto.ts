import { IsIn, IsNumber, IsOptional, IsString, Min } from "class-validator";

const CAMPAIGN_STATUSES = ["active", "paused", "completed"] as const;

export class UpdateCampaignDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  budget?: number;

  @IsOptional()
  @IsIn(CAMPAIGN_STATUSES)
  status?: string;

  @IsOptional()
  @IsString()
  market?: string;

  @IsOptional()
  @IsString()
  product?: string;
}
