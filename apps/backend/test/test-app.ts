import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { AppModule } from "../src/app.module";

export async function createTestApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.setGlobalPrefix("api/v1");
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })
  );
  await app.init();
  return app;
}

// Admin bypass toàn quyền không cần tra DB (xem PermissionGuard) — ký thẳng token test,
// không cần tạo Account thật trong DB cho mỗi lần chạy e2e.
export function signAdminToken(app: INestApplication): string {
  const jwtService = app.get(JwtService);
  return jwtService.sign({ sub: "e2e-admin", username: "admin", isAdmin: true });
}
