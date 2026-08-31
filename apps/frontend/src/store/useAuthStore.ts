import { create } from "zustand";
import type { AccountProfile } from "@fsolution/shared-types";
import { apiClient } from "../services/apiClient";
import { getToken, setToken, setUnauthorizedHandler } from "../services/authToken";

export type PermissionAction = "view" | "edit" | "delete";

interface AuthState {
  account: AccountProfile | null;
  status: "idle" | "loading" | "ready";
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
  hasPermission: (module: string, action: PermissionAction) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  account: null,
  status: "idle",

  async login(username, password) {
    const session = await apiClient.login({ username, password });
    setToken(session.accessToken);
    // Response đăng nhập không kèm đủ permissions -> gọi /auth/me lấy profile đầy đủ.
    await get().fetchMe();
  },

  logout() {
    setToken(null);
    set({ account: null, status: "ready" });
  },

  async fetchMe() {
    if (!getToken()) {
      set({ account: null, status: "ready" });
      return;
    }
    set({ status: "loading" });
    try {
      const account = await apiClient.getMe();
      set({ account, status: "ready" });
    } catch {
      setToken(null);
      set({ account: null, status: "ready" });
    }
  },

  hasPermission(module, action) {
    const account = get().account;
    if (!account) return false;
    if (account.isAdmin) return true;

    const permission = account.permissions?.find((p) => p.module === module);
    if (!permission) return false;
    if (action === "view") return permission.canView;
    if (action === "edit") return permission.canEdit;
    return permission.canDelete;
  }
}));

setUnauthorizedHandler(() => useAuthStore.getState().logout());
