import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import CskhLogsPage from "../src/pages/CskhLogsPage";

let logs: Array<Record<string, unknown>> = [];
const orders = [{ id: "11111111-0000-0000-0000-000000000000", customerId: "cus-1", totalAmount: 500000, status: "pending", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" }];
const customers = [{ id: "cus-1", name: "Nguyễn Văn A", phone: "0900000001", customerType: "new", blacklistStatus: false, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" }];

beforeEach(() => {
  logs = [
    { id: "1", orderId: orders[0].id, customerId: "cus-1", status: "called", note: "Gọi xác nhận", createdAt: "2026-01-01T00:00:00.000Z" }
  ];

  vi.stubGlobal(
    "fetch",
    vi.fn((url: string, init?: RequestInit) => {
      if (url.includes("/orders")) {
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(orders) });
      }
      if (url.includes("/customers")) {
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(customers) });
      }
      if (init?.method === "POST") {
        const created = { id: "2", ...JSON.parse(init.body as string), createdAt: "2026-01-02T00:00:00.000Z" };
        logs.push(created);
        return Promise.resolve({ ok: true, status: 201, json: () => Promise.resolve(created) });
      }
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(logs) });
    }) as unknown as typeof fetch
  );
});

describe("CskhLogsPage", () => {
  it("hiển thị lịch sử chăm sóc (chọn hợp đồng/khách hàng qua dropdown) và ghi nhận mới qua form", async () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <CskhLogsPage />
      </QueryClientProvider>
    );

    expect(await screen.findByText(`#${orders[0].id.slice(0, 8)}`)).toBeInTheDocument();
    // "Nguyễn Văn A" xuất hiện cả ở <option> trong select "Khách hàng" lẫn cột Khách hàng của bảng
    expect((await screen.findAllByText(/Nguyễn Văn A/)).length).toBeGreaterThanOrEqual(1);
    // "Đã gọi" xuất hiện cả ở badge lẫn <option> trong select "Kết quả"
    expect(screen.getAllByText("Đã gọi").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByLabelText("Từ ngày")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Xuất Excel" })).toBeInTheDocument();

    await userEvent.selectOptions(screen.getByLabelText("Hợp đồng"), orders[0].id);
    await userEvent.selectOptions(screen.getByLabelText("Khách hàng"), "cus-1");
    await userEvent.selectOptions(screen.getByLabelText("Kết quả"), "upsell");
    await userEvent.click(screen.getByRole("button", { name: "Ghi nhận" }));

    expect(await screen.findAllByText("Upsell")).not.toHaveLength(0);
  });
});
