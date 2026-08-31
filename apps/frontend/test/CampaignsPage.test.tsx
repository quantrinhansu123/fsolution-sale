import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import CampaignsPage from "../src/pages/CampaignsPage";

let campaigns: Array<Record<string, unknown>> = [];

beforeEach(() => {
  campaigns = [
    { id: "1", name: "Sàn gỗ Oak Q3", budget: 30000000, market: "US", product: "SGO-OAK-12MM", status: "active", createdAt: "2026-01-01T00:00:00.000Z" }
  ];

  vi.stubGlobal(
    "fetch",
    vi.fn((_url: string, init?: RequestInit) => {
      if (init?.method === "POST") {
        const created = {
          id: "2",
          ...JSON.parse(init.body as string),
          status: "active",
          createdAt: "2026-01-02T00:00:00.000Z"
        };
        campaigns.push(created);
        return Promise.resolve({ ok: true, status: 201, json: () => Promise.resolve(created) });
      }
      if (init?.method === "PATCH") {
        campaigns[0] = { ...campaigns[0], status: JSON.parse(init.body as string).status };
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(campaigns[0]) });
      }
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(campaigns) });
    }) as unknown as typeof fetch
  );
});

describe("CampaignsPage", () => {
  it("hiển thị danh sách chiến dịch và tạo mới qua form", async () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <CampaignsPage />
      </QueryClientProvider>
    );

    expect(await screen.findByText("Sàn gỗ Oak Q3")).toBeInTheDocument();
    // "Đang chạy" xuất hiện cả ở badge lẫn <option> trong select đổi trạng thái
    expect(screen.getAllByText("Đang chạy").length).toBeGreaterThanOrEqual(1);

    await userEvent.type(screen.getByLabelText("Tên chiến dịch"), "Sàn nhựa SPC Q4");
    await userEvent.type(screen.getByLabelText("Ngân sách (VNĐ)"), "20000000");
    await userEvent.click(screen.getByRole("button", { name: "Tạo chiến dịch" }));

    expect(await screen.findByText("Sàn nhựa SPC Q4")).toBeInTheDocument();
  });

  it("đổi trạng thái chiến dịch qua select gọi PATCH", async () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <CampaignsPage />
      </QueryClientProvider>
    );

    await screen.findByText("Sàn gỗ Oak Q3");
    await userEvent.selectOptions(screen.getByLabelText("Đổi trạng thái chiến dịch Sàn gỗ Oak Q3"), "paused");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/campaigns/1"),
      expect.objectContaining({ method: "PATCH" })
    );
  });
});
