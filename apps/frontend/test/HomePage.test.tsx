import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import HomePage from "../src/pages/HomePage";
import { useAuthStore } from "../src/store/useAuthStore";

const overview = {
  periods: ["04/2026", "05/2026", "06/2026", "07/2026", "08/2026"],
  revenueCostProfit: [
    { period: "04/2026", revenue: 1000, cost: 200, profit: 800 },
    { period: "05/2026", revenue: 1200, cost: 300, profit: 900 },
    { period: "06/2026", revenue: 1400, cost: 250, profit: 1150 },
    { period: "07/2026", revenue: 1600, cost: 400, profit: 1200 },
    { period: "08/2026", revenue: 1800, cost: 350, profit: 1450 }
  ],
  salesRevenue: [
    { employeeId: "emp-1", employeeName: "Lê Văn Sale", values: [100, 200, 150, 300, 250] },
    { employeeId: "emp-3", employeeName: "Phạm Thị Sale 2", values: [80, 90, 100, 120, 140] }
  ],
  marketingRevenue: [
    { employeeId: "emp-2", employeeName: "Trần Thị MKT", values: [50, 80, 60, 90, 100] },
    { employeeId: "emp-4", employeeName: "Ngô Văn MKT 2", values: [20, 30, 25, 35, 40] }
  ],
  leadStats: [
    { period: "04/2026", total: 5, byStatus: { new: 2, contacted: 1, qualified: 1, converted: 1, lost: 0 } },
    { period: "05/2026", total: 6, byStatus: { new: 2, contacted: 2, qualified: 1, converted: 1, lost: 0 } },
    { period: "06/2026", total: 4, byStatus: { new: 1, contacted: 1, qualified: 1, converted: 1, lost: 0 } },
    { period: "07/2026", total: 7, byStatus: { new: 3, contacted: 2, qualified: 1, converted: 1, lost: 0 } },
    { period: "08/2026", total: 8, byStatus: { new: 3, contacted: 2, qualified: 2, converted: 1, lost: 0 } }
  ],
  orderStats: [
    { period: "04/2026", total: 3, byStatus: { pending: 1, confirmed: 1, shipped: 0, delivered: 1, cancelled: 0 } },
    { period: "05/2026", total: 4, byStatus: { pending: 1, confirmed: 1, shipped: 1, delivered: 1, cancelled: 0 } },
    { period: "06/2026", total: 2, byStatus: { pending: 0, confirmed: 1, shipped: 0, delivered: 1, cancelled: 0 } },
    { period: "07/2026", total: 5, byStatus: { pending: 1, confirmed: 2, shipped: 0, delivered: 2, cancelled: 0 } },
    { period: "08/2026", total: 6, byStatus: { pending: 2, confirmed: 1, shipped: 1, delivered: 2, cancelled: 0 } }
  ],
  cskhStats: [
    { period: "04/2026", total: 2, byStatus: { called: 2, upsell: 0, cross_sell: 0, no_answer: 0 } },
    { period: "05/2026", total: 3, byStatus: { called: 2, upsell: 1, cross_sell: 0, no_answer: 0 } },
    { period: "06/2026", total: 1, byStatus: { called: 1, upsell: 0, cross_sell: 0, no_answer: 0 } },
    { period: "07/2026", total: 4, byStatus: { called: 2, upsell: 1, cross_sell: 1, no_answer: 0 } },
    { period: "08/2026", total: 3, byStatus: { called: 1, upsell: 1, cross_sell: 0, no_answer: 1 } }
  ],
  cashFlow: [
    { period: "04/2026", income: 1000, expense: 200 },
    { period: "05/2026", income: 1200, expense: 300 },
    { period: "06/2026", income: 1400, expense: 250 },
    { period: "07/2026", income: 1600, expense: 400 },
    { period: "08/2026", income: 1800, expense: 350 }
  ]
};

function renderHome() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <HomePage />
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) => {
      if (url.includes("/dashboard/overview")) {
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(overview) });
      }
      if (url.includes("/health")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ status: "ok", timestamp: "2026-01-01T00:00:00.000Z" })
        });
      }
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) });
    }) as unknown as typeof fetch
  );
});

describe("HomePage", () => {
  it("admin thấy Dashboard Tổng Quan với bộ lọc kỳ và đủ 7 biểu đồ (mới)", async () => {
    useAuthStore.setState({
      account: { id: "1", username: "admin", isAdmin: true, createdAt: "2026-01-01T00:00:00.000Z" },
      status: "ready"
    });

    renderHome();

    expect(await screen.findByText("Doanh thu · Chi phí · Lợi nhuận")).toBeInTheDocument();
    expect(screen.getByText("Thu · Chi")).toBeInTheDocument();
    expect(screen.getByText("Doanh thu theo nhân viên Sale")).toBeInTheDocument();
    expect(screen.getByText("Doanh thu Marketing (gắn với Lead)")).toBeInTheDocument();
    expect(screen.getByText("Số lượng & trạng thái Lead")).toBeInTheDocument();
    expect(screen.getByText("Số lượng & trạng thái Hợp đồng")).toBeInTheDocument();
    expect(screen.getByText("Số lượng & kết quả chăm sóc khách hàng")).toBeInTheDocument();

    // bộ lọc kỳ Ngày/Tuần/Tháng
    expect(screen.getByRole("button", { name: "Ngày" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tuần" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tháng" })).toBeInTheDocument();

    // tên nhân viên Sale/Marketing xuất hiện trong legend
    expect(screen.getByText("Lê Văn Sale")).toBeInTheDocument();
    expect(screen.getByText("Trần Thị MKT")).toBeInTheDocument();

    expect(await screen.findByText("Backend online")).toBeInTheDocument();
  });

  it("tài khoản không phải admin không thấy Dashboard, chỉ thấy màn chào mừng", async () => {
    useAuthStore.setState({
      account: { id: "2", username: "lead", isAdmin: false, createdAt: "2026-01-01T00:00:00.000Z" },
      status: "ready"
    });

    renderHome();

    expect(await screen.findByText("Backend online")).toBeInTheDocument();
    expect(screen.queryByText("Doanh thu · Chi phí · Lợi nhuận")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Tháng" })).not.toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalledWith(expect.stringContaining("/dashboard/overview"), expect.anything());
  });
});
