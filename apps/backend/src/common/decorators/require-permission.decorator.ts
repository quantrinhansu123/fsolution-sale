import { SetMetadata } from "@nestjs/common";

export type PermissionAction = "view" | "edit" | "delete";

export const REQUIRE_PERMISSION_KEY = "requirePermission";

export const RequirePermission = (module: string, action: PermissionAction) =>
  SetMetadata(REQUIRE_PERMISSION_KEY, { module, action });
