import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AuditLogsPage from "../src/pages/AuditLogsPage";

beforeEach(() => {
  const logs = [
    {
      id: "1",
      tableName: "Order",
      recordId: "order-1",
      fieldChanged: "status",
      oldValue: "pending",
      newValue: "confirmed",
      changedBy: "admin-id",
      createdAt: "2026-01-01T00:00:00.000Z"
    }
  ];

  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(logs) })) as unknown as typeof fetch
  );
});

describe("AuditLogsPage", () => {
  it("hiển thị nhật ký thay đổi với đầy đủ bảng/trường/giá trị cũ-mới", async () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <AuditLogsPage />
      </QueryClientProvider>
    );

    expect(await screen.findByText("Order")).toBeInTheDocument();
    expect(screen.getByText(/pending → confirmed/)).toBeInTheDocument();
    expect(screen.getByLabelText("Từ ngày")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Xuất Excel" })).toBeInTheDocument();
  });
});
