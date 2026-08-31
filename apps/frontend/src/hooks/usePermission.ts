import { useAuthStore, PermissionAction } from "../store/useAuthStore";

export function usePermission(module: string, action: PermissionAction): boolean {
  return useAuthStore((s) => s.hasPermission(module, action));
}
