import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { getToken } from "../services/authToken";

export default function RequireAuth({ children }: { children: ReactNode }) {
  const account = useAuthStore((s) => s.account);
  const status = useAuthStore((s) => s.status);

  if (!getToken()) return <Navigate to="/login" replace />;

  if (status !== "ready") {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-gray-500">
        Đang tải...
      </div>
    );
  }

  if (!account) return <Navigate to="/login" replace />;

  return <>{children}</>;
}
