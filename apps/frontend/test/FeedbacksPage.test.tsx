import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import FeedbacksPage from "../src/pages/FeedbacksPage";

let feedbacks: Array<Record<string, unknown>> = [];

beforeEach(() => {
  feedbacks = [
    { id: "1", customerId: "CUS-001", source: "CSKH", content: "Hài lòng với sản phẩm", rating: 5, createdAt: "2026-01-01T00:00:00.000Z" }
  ];

  vi.stubGlobal(
    "fetch",
    vi.fn((_url: string, init?: RequestInit) => {
      if (init?.method === "POST") {
        const created = { id: "2", ...JSON.parse(init.body as string), createdAt: "2026-01-02T00:00:00.000Z" };
        feedbacks.push(created);
        return Promise.resolve({ ok: true, status: 201, json: () => Promise.resolve(created) });
      }
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(feedbacks) });
    }) as unknown as typeof fetch
  );
});

describe("FeedbacksPage", () => {
  it("hiển thị danh sách phản hồi và ghi nhận mới qua form", async () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <FeedbacksPage />
      </QueryClientProvider>
    );

    expect(await screen.findByText("Hài lòng với sản phẩm")).toBeInTheDocument();
    // "CSKH" xuất hiện cả ở badge lẫn <option> trong select "Nguồn"
    expect(screen.getAllByText("CSKH").length).toBeGreaterThanOrEqual(1);

    await userEvent.type(screen.getByLabelText("Mã Khách hàng"), "CUS-002");
    await userEvent.selectOptions(screen.getByLabelText("Nguồn"), "Sale");
    await userEvent.type(screen.getByLabelText("Nội dung"), "Giao hàng nhanh");
    await userEvent.click(screen.getByRole("button", { name: "Ghi nhận" }));

    expect(await screen.findByText("Giao hàng nhanh")).toBeInTheDocument();
  });
});
