import { IsNotEmpty, IsOptional, IsString, MinLength } from "class-validator";

// Mật khẩu mặc định "abc123" (skills/build/auth-and-permissions/SKILL.md) vẫn được dùng khi admin
// bỏ trống trường password — nhưng admin có thể tự đặt mật khẩu ban đầu ngay lúc tạo tài khoản.
export class CreateAccountDto {
  @IsString()
  @IsNotEmpty()
  username!: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
}
