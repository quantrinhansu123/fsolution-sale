import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { JwtPayload } from "../types/jwt-payload";

export const CurrentAccount = createParamDecorator((_data: unknown, ctx: ExecutionContext): JwtPayload => {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
});
