import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as XLSX from "xlsx";
import OrdersPage from "../src/pages/OrdersPage";

vi.mock("xlsx", () => ({
  utils: {
    json_to_sheet: vi.fn(() => ({})),
    book_new: vi.fn(() => ({})),
    book_append_sheet: vi.fn()
  },
  writeFile: vi.fn()
}));

let orders: Array<Record<string, unknown>> = [];
const products = [
  { id: "p1", name: "Sàn gỗ Oak 12mm", sku: "SGO-OAK-12MM", unit: "m2", price: 250000, createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "p2", name: "Nẹp chữ T", sku: "PHUKIEN-NEP-T", unit: "thanh", price: 45000, createdAt: "2026-01-01T00:00:00.000Z" }
];
const leads = [
  { id: "lead-1", code: "AB12", name: "Khách Đã Chốt", phone: "0911111111", source: "Facebook Ads", status: "converted", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" }
];

beforeEach(() => {
  orders = [
    {
      id: "1",
      customerId: "cus-1",
      customerName: "Nguyễn Văn A",
      leadId: "lead-1",
      leadCode: "AB12",
      assignedTo: "emp-1",
      assignedToName: "Lê Văn Sale",
      totalAmount: 500000,
      status: "pending",
      items: [{ id: "item-1", orderId: "1", productId: "p1", productName: "Sàn gỗ Oak 12mm", unit: "m2", quantity: 2, unitPrice: 250000, discountPercent: 10, isGift: false, createdAt: "2026-01-01T00:00:00.000Z" }],
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z"
    }
  ];

  vi.stubGlobal(
    "fetch",
    vi.fn((url: string, init?: RequestInit) => {
      if (url.includes("/products")) {
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(products) });
      }
      if (url.includes("/leads")) {
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(leads) });
      }
      if (url.includes("/items")) {
        if (init?.method === "POST") {
          const created = { id: "item-x", ...JSON.parse(init.body as string), isGift: false, createdAt: "2026-01-02T00:00:00.000Z" };
          return Promise.resolve({ ok: true, status: 201, json: () => Promise.resolve(created) });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(orders[0].items)
        });
      }
      if (init?.method === "POST") {
        const created = {
          id: "2",
          customerId: "cus-1",
          items: [],
          ...JSON.parse(init.body as string),
          status: "pending",
          createdAt: "2026-01-02T00:00:00.000Z",
          updatedAt: "2026-01-02T00:00:00.000Z"
        };
        orders.push(created);
        return Promise.resolve({ ok: true, status: 201, json: () => Promise.resolve(created) });
      }
      if (init?.method === "PATCH") {
        orders[0] = { ...orders[0], status: JSON.parse(init.body as string).status };
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(orders[0]) });
      }
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(orders) });
    }) as unknown as typeof fetch
  );
});

describe("OrdersPage", () => {
  it("hiển thị danh sách hợp đồng (khách hàng, Sale phụ trách, sản phẩm) và tạo mới qua form (mới Phase 3)", async () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <OrdersPage />
      </QueryClientProvider>
    );

    expect(await screen.findByText("Nguyễn Văn A")).toBeInTheDocument();
    expect(screen.getByText("Lê Văn Sale")).toBeInTheDocument();
    expect(screen.getByText("AB12")).toBeInTheDocument();
    expect(screen.getByText("Chờ xử lý")).toBeInTheDocument();

    await userEvent.selectOptions(screen.getByLabelText("Chọn mã Lead"), "lead-1");
    await userEvent.type(screen.getByLabelText("Tên khách hàng"), "Trần Thị B");
    await userEvent.selectOptions(screen.getByLabelText("Chọn sản phẩm"), "p1");
    await userEvent.clear(screen.getByLabelText("Số lượng"));
    await userEvent.type(screen.getByLabelText("Số lượng"), "3");
    await userEvent.clear(screen.getByLabelText("Giá bán"));
    await userEvent.type(screen.getByLabelText("Giá bán"), "200000");
    await userEvent.type(screen.getByLabelText("% Khuyến mại"), "10");
    await userEvent.type(screen.getByLabelText("Địa chỉ nhận hàng"), "12 Láng Hạ");
    await userEvent.type(screen.getByLabelText("Số điện thoại nhận hàng"), "0909999999");

    // Thành tiền = 3 * 200000 * (1 - 10/100) = 540000
    expect(screen.getByText(/540.000/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Tạo đơn" }));

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/orders"),
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("Trần Thị B")
      })
    );
  });

  it("xem sản phẩm trong đơn; select trạng thái bị khoá khi đơn đã delivered", async () => {
    orders[0] = { ...orders[0], status: "delivered" };
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <OrdersPage />
      </QueryClientProvider>
    );

    await screen.findByText("Nguyễn Văn A");

    const statusSelect = screen.getByLabelText("Đổi trạng thái đơn cus-1");
    expect(statusSelect).toBeDisabled();

    await userEvent.click(screen.getByRole("button", { name: "Xem" }));
    expect((await screen.findAllByText(/Sàn gỗ Oak 12mm/)).length).toBeGreaterThanOrEqual(2);
    // % Khuyến mại của từng sản phẩm phải hiện trong danh sách mở rộng (mới)
    expect(screen.getByText(/-10%/)).toBeInTheDocument();
  });

  it("Thêm sản phẩm cho phép tạo đơn nhiều sản phẩm, tự động gán Đơn vị tính + Giá bán theo sản phẩm chọn", async () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <OrdersPage />
      </QueryClientProvider>
    );

    await screen.findByText("Nguyễn Văn A");

    await userEvent.type(screen.getByLabelText("Tên khách hàng"), "Khách Nhiều SP");
    await userEvent.selectOptions(screen.getByLabelText("Chọn sản phẩm"), "p1");

    expect(screen.getByText("Đơn vị tính:")).toBeInTheDocument();
    expect(screen.getByText("m2")).toBeInTheDocument();
    expect(screen.getByLabelText("Giá bán")).toHaveValue(250000);

    await userEvent.click(screen.getByRole("button", { name: "+ Thêm sản phẩm" }));

    const productSelects = screen.getAllByLabelText("Chọn sản phẩm");
    expect(productSelects).toHaveLength(2);
    await userEvent.selectOptions(productSelects[1], "p2");

    expect(screen.getByText("thanh")).toBeInTheDocument();
    expect(screen.getAllByLabelText("Giá bán")[1]).toHaveValue(45000);

    await userEvent.type(screen.getByLabelText("Địa chỉ nhận hàng"), "12 Láng Hạ");
    await userEvent.type(screen.getByLabelText("Số điện thoại nhận hàng"), "0909999999");

    await userEvent.click(screen.getByRole("button", { name: "Tạo đơn" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/orders\/.+\/items/),
        expect.objectContaining({ method: "POST", body: expect.stringContaining("Nẹp chữ T") })
      );
    });
  });

  it("Xuất Excel tạo workbook từ danh sách hợp đồng đang hiển thị, kèm cột Mã Lead", async () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <OrdersPage />
      </QueryClientProvider>
    );

    await screen.findByText("Nguyễn Văn A");

    await userEvent.click(screen.getByRole("button", { name: "Xuất Excel" }));

    expect(XLSX.utils.json_to_sheet).toHaveBeenCalledWith([
      expect.objectContaining({ "Khách hàng": "Nguyễn Văn A", "Mã Lead": "AB12" })
    ]);
    expect(XLSX.writeFile).toHaveBeenCalledWith(expect.anything(), expect.stringMatching(/^don-hang-.*\.xlsx$/));
  });
});
