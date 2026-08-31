import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateLeadDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  phone!: string;

  @IsString()
  @IsNotEmpty()
  source!: string;

  @IsOptional()
  @IsString()
  productInterest?: string;

  @IsOptional()
  @IsString()
  threadId?: string;

  // Mới — cho phép chọn tay nhân viên Marketing gắn với Lead này thay vì luôn round-robin.
  // Bỏ trống thì service tự động round-robin như trước.
  @IsOptional()
  @IsString()
  sourcedBy?: string;
}
