import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import CustomersPage from "../src/pages/CustomersPage";

let customers: Array<Record<string, unknown>> = [];

beforeEach(() => {
  customers = [
    {
      id: "1",
      name: "Nguyễn Văn A",
      phone: "0911111111",
      address: "123 Láng Hạ",
      city: "Hà Nội",
      customerType: "new",
      blacklistStatus: false,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z"
    }
  ];

  vi.stubGlobal(
    "fetch",
    vi.fn((_url: string, init?: RequestInit) => {
      if (init?.method === "POST") {
        const created = {
          id: "2",
          ...JSON.parse(init.body as string),
          customerType: "new",
          blacklistStatus: false,
          createdAt: "2026-01-02T00:00:00.000Z",
          updatedAt: "2026-01-02T00:00:00.000Z"
        };
        customers.push(created);
        return Promise.resolve({ ok: true, status: 201, json: () => Promise.resolve(created) });
      }
      if (init?.method === "PATCH") {
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(customers[0]) });
      }
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(customers) });
    }) as unknown as typeof fetch
  );
});

describe("CustomersPage", () => {
  it("hiển thị danh sách khách hàng và tạo mới qua form", async () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <CustomersPage />
      </QueryClientProvider>
    );

    expect(await screen.findByText("Nguyễn Văn A")).toBeInTheDocument();
    expect(screen.getByText("Khách mới")).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText("Họ tên"), "Trần Thị B");
    await userEvent.type(screen.getByLabelText("Số điện thoại"), "0922222222");
    await userEvent.click(screen.getByRole("button", { name: "Lưu thông tin" }));

    expect(await screen.findByText("Trần Thị B")).toBeInTheDocument();
  });

  it("bấm badge loại khách hàng gọi API đổi customerType", async () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <CustomersPage />
      </QueryClientProvider>
    );

    const badge = await screen.findByText("Khách mới");
    await userEvent.click(badge);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/customers/1"),
      expect.objectContaining({ method: "PATCH" })
    );
  });
});
