import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class CreateCampaignDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsNumber()
  @Min(0)
  budget!: number;

  @IsOptional()
  @IsString()
  market?: string;

  @IsOptional()
  @IsString()
  product?: string;
}
