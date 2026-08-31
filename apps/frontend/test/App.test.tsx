import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "../src/App";
import { setToken } from "../src/services/authToken";
import { useAuthStore } from "../src/store/useAuthStore";

beforeEach(() => {
  setToken(null);
  useAuthStore.setState({ account: null, status: "idle" });
  // BrowserRouter dùng history API thật của jsdom -> reset lại URL giữa các test,
  // nếu không lần redirect /login của test trước sẽ rò rỉ sang test sau.
  window.history.pushState({}, "", "/");
});

describe("App", () => {
  it("chưa đăng nhập -> chuyển hướng tới trang đăng nhập", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("không nên gọi fetch khi chưa đăng nhập"))));

    render(
      <QueryClientProvider client={new QueryClient()}>
        <App />
      </QueryClientProvider>
    );

    expect(await screen.findByLabelText("Tài khoản")).toBeInTheDocument();
    expect(screen.queryByText("Backend online")).not.toBeInTheDocument();
  });

  it("đã đăng nhập -> hiển thị sidebar + Dashboard", async () => {
    setToken("fake-token");
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) => {
        if (url.includes("/auth/me")) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () =>
              Promise.resolve({ id: "1", username: "admin", isAdmin: true, createdAt: "2026-01-01T00:00:00.000Z" }),
          });
        }
        if (url.includes("/health")) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ status: "ok", timestamp: "2026-01-01T00:00:00.000Z" }),
          });
        }
        if (url.includes("/dashboard/overview")) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () =>
              Promise.resolve({
                periods: [],
                revenueCostProfit: [],
                salesRevenue: [],
                marketingRevenue: [],
                leadStats: [],
                orderStats: [],
                cskhStats: [],
                cashFlow: [],
              }),
          });
        }
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) });
      }) as unknown as typeof fetch
    );

    render(
      <QueryClientProvider client={new QueryClient()}>
        <App />
      </QueryClientProvider>
    );

    expect(await screen.findByText("Backend online")).toBeInTheDocument();
    expect(screen.getAllByText("F-Solution").length).toBeGreaterThan(0);
    expect(screen.getAllByText("admin").length).toBeGreaterThan(0);
  });
});
