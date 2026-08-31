import { IsBoolean, IsNotEmpty, IsOptional, IsString, MinLength } from "class-validator";

export class UpdateAccountDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  username?: string;

  // true = reset mật khẩu về mặc định "abc123" (dùng khi người dùng quên mật khẩu)
  @IsOptional()
  @IsBoolean()
  resetPassword?: boolean;

  // Đặt mật khẩu tuỳ ý thay vì reset về mặc định — ưu tiên hơn resetPassword nếu cả hai cùng gửi.
  @IsOptional()
  @IsString()
  @MinLength(6)
  newPassword?: string;
}
