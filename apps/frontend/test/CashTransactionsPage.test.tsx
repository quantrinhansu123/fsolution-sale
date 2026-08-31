import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import CashTransactionsPage from "../src/pages/CashTransactionsPage";

let transactions: Array<Record<string, unknown>> = [];
const cashAccounts = [{ id: "ca-1", code: "1.1US", name: "Quỹ tiền mặt US", type: "income", active: true, createdAt: "2026-01-01T00:00:00.000Z" }];

beforeEach(() => {
  transactions = [
    { id: "1", cashAccountId: "ca-1", type: "income", content: "Thu tiền đơn ORD-001", amount: 1000000, transactionDate: "2026-01-01", createdAt: "2026-01-01T00:00:00.000Z" }
  ];

  vi.stubGlobal(
    "fetch",
    vi.fn((url: string, init?: RequestInit) => {
      if (url.includes("/cash-accounts")) {
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(cashAccounts) });
      }
      if (init?.method === "POST") {
        const created = { id: "2", ...JSON.parse(init.body as string), createdAt: "2026-01-02T00:00:00.000Z" };
        transactions.push(created);
        return Promise.resolve({ ok: true, status: 201, json: () => Promise.resolve(created) });
      }
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(transactions) });
    }) as unknown as typeof fetch
  );
});

describe("CashTransactionsPage", () => {
  it("hiển thị sổ quỹ và ghi thêm dòng Thu/Chi qua form", async () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <CashTransactionsPage />
      </QueryClientProvider>
    );

    expect(await screen.findByText("Thu tiền đơn ORD-001")).toBeInTheDocument();
    await screen.findByText("1.1US — Quỹ tiền mặt US");
    expect(screen.getByLabelText("Từ ngày")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Xuất Excel" })).toBeInTheDocument();

    await userEvent.selectOptions(screen.getByLabelText("Mã tài khoản"), "ca-1");
    await userEvent.type(screen.getByLabelText("Nội dung"), "Chi phí quảng cáo tháng 8");
    await userEvent.type(screen.getByLabelText("Số tiền (VNĐ)"), "2000000");
    await userEvent.type(screen.getByLabelText("Ngày giao dịch"), "2026-08-24");
    await userEvent.click(screen.getByRole("button", { name: "Ghi sổ" }));

    expect(await screen.findByText("Chi phí quảng cáo tháng 8")).toBeInTheDocument();
  });
});
