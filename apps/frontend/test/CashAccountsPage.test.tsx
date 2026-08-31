import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import CashAccountsPage from "../src/pages/CashAccountsPage";

let cashAccounts: Array<Record<string, unknown>> = [];

beforeEach(() => {
  cashAccounts = [
    { id: "1", code: "1.1US", name: "Quỹ tiền mặt US", type: "income", branch: "HN", market: "US", active: true, createdAt: "2026-01-01T00:00:00.000Z" }
  ];

  vi.stubGlobal(
    "fetch",
    vi.fn((_url: string, init?: RequestInit) => {
      if (init?.method === "POST") {
        const created = { id: "2", ...JSON.parse(init.body as string), active: true, createdAt: "2026-01-02T00:00:00.000Z" };
        cashAccounts.push(created);
        return Promise.resolve({ ok: true, status: 201, json: () => Promise.resolve(created) });
      }
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(cashAccounts) });
    }) as unknown as typeof fetch
  );
});

describe("CashAccountsPage", () => {
  it("hiển thị danh sách mã tài khoản và tạo mới qua form", async () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <CashAccountsPage />
      </QueryClientProvider>
    );

    expect(await screen.findByText("Quỹ tiền mặt US")).toBeInTheDocument();
    expect(screen.getByText("1.1US")).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText("Mã"), "2.1HN");
    await userEvent.type(screen.getByLabelText("Tên tài khoản"), "Quỹ chi phí HN");
    await userEvent.selectOptions(screen.getByLabelText("Loại"), "expense");
    await userEvent.click(screen.getByRole("button", { name: "Tạo mã tài khoản" }));

    expect(await screen.findByText("Quỹ chi phí HN")).toBeInTheDocument();
  });
});
