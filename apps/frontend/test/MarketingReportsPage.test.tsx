import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import MarketingReportsPage from "../src/pages/MarketingReportsPage";

let reports: Array<Record<string, unknown>> = [];
const autoReports = [
  { employeeId: "mkt-1", employeeName: "Trần Thị MKT", leadCount: 5, orderCount: 2, revenue: 12_000_000 }
];

beforeEach(() => {
  reports = [
    {
      id: "1",
      date: "2026-08-01T00:00:00.000Z",
      shift: "Sáng",
      product: "SGO-OAK-12MM",
      market: "US",
      team: "Team A",
      adCost: 2000000,
      messageCount: 50,
      orderCount: 5,
      revenue: 10000000,
      revenueActual: 9000000,
      createdAt: "2026-08-01T00:00:00.000Z"
    }
  ];

  vi.stubGlobal(
    "fetch",
    vi.fn((url: string, init?: RequestInit) => {
      if (url.includes("/marketing-reports/auto")) {
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(autoReports) });
      }
      if (init?.method === "POST") {
        const created = { id: "2", ...JSON.parse(init.body as string), createdAt: "2026-08-02T00:00:00.000Z" };
        reports.push(created);
        return Promise.resolve({ ok: true, status: 201, json: () => Promise.resolve(created) });
      }
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(reports) });
    }) as unknown as typeof fetch
  );
});

describe("MarketingReportsPage", () => {
  it("hiển thị Báo cáo tự động Marketing (doanh thu theo nhân viên MKT) phía trên Lịch sử báo cáo (mới)", async () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MarketingReportsPage />
      </QueryClientProvider>
    );

    expect(await screen.findByText("Báo cáo tự động Marketing")).toBeInTheDocument();
    expect(await screen.findByText("Trần Thị MKT")).toBeInTheDocument();
    expect(screen.getByText(/12\.000\.000/)).toBeInTheDocument();

    // 2 bộ lọc "Từ ngày" + 2 nút "Xuất Excel" — 1 cho báo cáo tự động, 1 cho lịch sử nhập tay
    expect(screen.getAllByLabelText("Từ ngày")).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "Xuất Excel" })).toHaveLength(2);
  });

  it("hiển thị lịch sử báo cáo và tạo mới qua form", async () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MarketingReportsPage />
      </QueryClientProvider>
    );

    expect(await screen.findByText(/Team A/)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Ngày"), { target: { value: "2026-08-10" } });
    await userEvent.type(screen.getByLabelText("Ca"), "Chiều");
    await userEvent.type(screen.getByLabelText("Team"), "Team B");
    await userEvent.type(screen.getByLabelText("Sản phẩm"), "SNHUA-SPC-4MM");
    await userEvent.type(screen.getByLabelText("Thị trường"), "CAN");
    await userEvent.type(screen.getByLabelText("Chi phí Ads (VNĐ)"), "1500000");
    await userEvent.type(screen.getByLabelText("Số Mess"), "40");
    await userEvent.type(screen.getByLabelText("Số đơn"), "3");
    await userEvent.type(screen.getByLabelText("Doanh số (VNĐ)"), "8000000");
    await userEvent.type(screen.getByLabelText("Doanh thu thực (VNĐ)"), "7000000");
    await userEvent.click(screen.getByRole("button", { name: "Lưu báo cáo" }));

    expect(await screen.findByText(/Team B/)).toBeInTheDocument();
  });
});
