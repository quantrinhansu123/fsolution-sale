import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import SystemConfigsPage from "../src/pages/SystemConfigsPage";

let configs: Array<Record<string, unknown>> = [];

beforeEach(() => {
  configs = [
    { id: "1", key: "exchange_rate_usd", value: "24000", description: "Tỷ giá USD/VND", updatedAt: "2026-01-01T00:00:00.000Z" }
  ];

  vi.stubGlobal(
    "fetch",
    vi.fn((_url: string, init?: RequestInit) => {
      if (init?.method === "PATCH") {
        configs[0] = { ...configs[0], value: JSON.parse(init.body as string).value };
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(configs[0]) });
      }
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(configs) });
    }) as unknown as typeof fetch
  );
});

describe("SystemConfigsPage", () => {
  it("hiển thị danh sách cấu hình và sửa value qua nút Sửa/Lưu", async () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <SystemConfigsPage />
      </QueryClientProvider>
    );

    expect(await screen.findByText("exchange_rate_usd")).toBeInTheDocument();
    expect(screen.getByText("24000")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Sửa" }));
    const input = screen.getByLabelText("Giá trị mới cho exchange_rate_usd");
    await userEvent.clear(input);
    await userEvent.type(input, "25000");
    await userEvent.click(screen.getByRole("button", { name: "Lưu" }));

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/system-configs/exchange_rate_usd"),
      expect.objectContaining({ method: "PATCH" })
    );
    expect(await screen.findByText("25000")).toBeInTheDocument();
  });
});
