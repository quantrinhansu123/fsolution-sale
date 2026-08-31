import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import SaleReportsPage from "../src/pages/SaleReportsPage";

const autoReports = [
  {
    date: "2026-08-01",
    employeeId: "emp-1",
    employeeName: "Nguyễn Văn A",
    newLeadsAssigned: 3,
    leadsToContacted: 2,
    leadsToQualified: 1,
    leadsToConverted: 1,
    leadsToLost: 0,
    orderCount: 2,
    productsSold: 4,
    revenueTotal: 3000000,
    revenueConfirmed: 2000000,
    newCustomers: 1,
    returningCustomers: 1
  }
];

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) => {
      if (url.includes("/sale-reports/auto")) {
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(autoReports) });
      }
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) });
    }) as unknown as typeof fetch
  );
});

describe("SaleReportsPage", () => {
  it("hiển thị báo cáo tự động theo ngày, không còn form nhập tay (mới Phase 3)", async () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <SaleReportsPage />
      </QueryClientProvider>
    );

    expect(await screen.findByText("Nguyễn Văn A")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument(); // newLeadsAssigned
    expect(screen.queryByRole("button", { name: "Lưu báo cáo" })).not.toBeInTheDocument();

    expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/sale-reports/auto?date="), expect.anything());
  });

  it("đổi ngày gọi lại API với query param date mới", async () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <SaleReportsPage />
      </QueryClientProvider>
    );

    await screen.findByText("Nguyễn Văn A");
    fireEvent.change(screen.getByLabelText("Từ ngày"), { target: { value: "2026-08-10" } });

    expect(await screen.findByText((_, el) => el?.tagName === "H2" && !!el.textContent?.includes("2026"))).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/sale-reports/auto?date=2026-08-10"), expect.anything());
  });
});
