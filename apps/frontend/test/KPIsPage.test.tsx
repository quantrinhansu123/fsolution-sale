import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import KPIsPage from "../src/pages/KPIsPage";

let kpis: Array<Record<string, unknown>> = [];
const employees = [{ id: "emp-1", name: "Nguyễn Văn A", email: "a@fsolution.vn", role: "Sale", status: "active", createdAt: "2026-01-01T00:00:00.000Z" }];

beforeEach(() => {
  kpis = [
    { id: "1", employeeId: "emp-1", period: "2026-07", score: 8, bonus: 500000, createdAt: "2026-01-01T00:00:00.000Z" }
  ];

  vi.stubGlobal(
    "fetch",
    vi.fn((url: string, init?: RequestInit) => {
      if (url.includes("/employees")) {
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(employees) });
      }
      if (init?.method === "POST") {
        const created = { id: "2", ...JSON.parse(init.body as string), createdAt: "2026-01-02T00:00:00.000Z" };
        kpis.push(created);
        return Promise.resolve({ ok: true, status: 201, json: () => Promise.resolve(created) });
      }
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(kpis) });
    }) as unknown as typeof fetch
  );
});

describe("KPIsPage", () => {
  it("hiển thị danh sách KPI (tên nhân sự tra từ employees) và ghi nhận mới qua form", async () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <KPIsPage />
      </QueryClientProvider>
    );

    // "Nguyễn Văn A" xuất hiện cả ở <option> trong select "Nhân sự" lẫn cột Nhân sự của bảng
    expect((await screen.findAllByText("Nguyễn Văn A")).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("2026-07")).toBeInTheDocument();

    await userEvent.selectOptions(screen.getByLabelText("Nhân sự"), "emp-1");
    await userEvent.type(screen.getByLabelText("Kỳ (vd 2026-08)"), "2026-08");
    await userEvent.type(screen.getByLabelText("Điểm số"), "9");
    await userEvent.click(screen.getByRole("button", { name: "Ghi nhận" }));

    expect(await screen.findByText("2026-08")).toBeInTheDocument();
  });
});
