import { Body, Controller, Get, HttpCode, HttpStatus, Patch, Post } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { Public } from "../../common/decorators/public.decorator";
import { CurrentAccount } from "../../common/decorators/current-account.decorator";
import { JwtPayload } from "../../common/types/jwt-payload";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    const account = await this.authService.validateAccount(dto.username, dto.password);
    return this.authService.issueToken(account);
  }

  @Get("me")
  getMe(@CurrentAccount() account: JwtPayload) {
    return this.authService.getProfile(account.sub);
  }

  @Patch("change-password")
  @HttpCode(HttpStatus.OK)
  async changePassword(@CurrentAccount() account: JwtPayload, @Body() dto: ChangePasswordDto) {
    await this.authService.changePassword(account.sub, dto.oldPassword, dto.newPassword);
    return { message: "Đổi mật khẩu thành công" };
  }
}
