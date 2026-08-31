import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import PaymentsPage from "../src/pages/PaymentsPage";

let payments: Array<Record<string, unknown>> = [];

beforeEach(() => {
  payments = [
    { id: "1", orderId: "ORD-001", amount: 500000, status: "pending", method: "Chuyển khoản", createdAt: "2026-01-01T00:00:00.000Z" }
  ];

  vi.stubGlobal(
    "fetch",
    vi.fn((_url: string, init?: RequestInit) => {
      if (init?.method === "POST") {
        const created = { id: "2", ...JSON.parse(init.body as string), status: "pending", createdAt: "2026-01-02T00:00:00.000Z" };
        payments.push(created);
        return Promise.resolve({ ok: true, status: 201, json: () => Promise.resolve(created) });
      }
      if (init?.method === "PATCH") {
        payments[0] = { ...payments[0], ...JSON.parse(init.body as string) };
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(payments[0]) });
      }
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(payments) });
    }) as unknown as typeof fetch
  );
});

describe("PaymentsPage", () => {
  it("hiển thị danh sách khoản thu và tạo mới qua form", async () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <PaymentsPage />
      </QueryClientProvider>
    );

    expect(await screen.findByText("ORD-001")).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText("Mã Hợp đồng"), "ORD-002");
    await userEvent.type(screen.getByLabelText("Số tiền (VNĐ)"), "700000");
    await userEvent.click(screen.getByRole("button", { name: "Ghi nhận" }));

    expect(await screen.findByText("ORD-002")).toBeInTheDocument();
  });

  it("đổi trạng thái sang completed tự gửi kèm reconciledAt", async () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <PaymentsPage />
      </QueryClientProvider>
    );

    await screen.findByText("ORD-001");
    await userEvent.selectOptions(screen.getByLabelText("Đổi trạng thái khoản thu ORD-001"), "completed");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/payments/1"),
      expect.objectContaining({
        method: "PATCH",
        body: expect.stringContaining("reconciledAt")
      })
    );
  });
});
