import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ProductsPage from "../src/pages/ProductsPage";

let products: Array<Record<string, unknown>> = [];
let performance: Array<Record<string, unknown>> = [];

beforeEach(() => {
  products = [
    { id: "1", name: "Gói CRM Pro", sku: "CRM-PRO", unit: "gói 12 tháng", price: 250000, category: "crm", createdAt: "2026-01-01T00:00:00.000Z" }
  ];
  performance = [
    { id: "p1", productId: "1", stage: "GĐ1", evaluation: "win", orderCount: 10, revenue: 2500000, createdAt: "2026-01-02T00:00:00.000Z" }
  ];

  vi.stubGlobal(
    "fetch",
    vi.fn((url: string, init?: RequestInit) => {
      if (url.includes("/product-performance")) {
        if (init?.method === "POST") {
          const created = { id: "p2", ...JSON.parse(init.body as string), createdAt: "2026-01-03T00:00:00.000Z" };
          performance.push(created);
          return Promise.resolve({ ok: true, status: 201, json: () => Promise.resolve(created) });
        }
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(performance) });
      }
      if (init?.method === "POST") {
        const created = { id: "2", ...JSON.parse(init.body as string), createdAt: "2026-01-02T00:00:00.000Z" };
        products.push(created);
        return Promise.resolve({ ok: true, status: 201, json: () => Promise.resolve(created) });
      }
      if (init?.method === "PATCH") {
        products[0] = { ...products[0], ...JSON.parse(init.body as string) };
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(products[0]) });
      }
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(products) });
    }) as unknown as typeof fetch
  );
});

describe("ProductsPage", () => {
  it("hiển thị danh sách sản phẩm và tạo mới qua form", async () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <ProductsPage />
      </QueryClientProvider>
    );

    expect(await screen.findByText("Gói CRM Pro")).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText("Tên sản phẩm"), "Gói ERP Basic");
    await userEvent.selectOptions(screen.getByLabelText("Đơn vị tính"), "gói 12 tháng");
    await userEvent.type(screen.getByLabelText("Mã SKU"), "ERP-BASIC");
    await userEvent.type(screen.getByLabelText("Giá (VNĐ)"), "180000");
    await userEvent.click(screen.getByRole("button", { name: "Tạo sản phẩm" }));

    expect(await screen.findByText("Gói ERP Basic")).toBeInTheDocument();
  });

  it("Sửa -> đổi giá gọi PATCH; Xem hiệu quả test hiển thị + ghi nhận thêm 1 lần test", async () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <ProductsPage />
      </QueryClientProvider>
    );

    await screen.findByText("Gói CRM Pro");

    await userEvent.click(screen.getByRole("button", { name: "Sửa" }));
    const priceInput = screen.getByLabelText("Giá (VNĐ)", { selector: "#edit-price-1" });
    await userEvent.clear(priceInput);
    await userEvent.type(priceInput, "270000");
    await userEvent.click(screen.getByRole("button", { name: "Lưu" }));

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/products/1"),
      expect.objectContaining({ method: "PATCH" })
    );

    await userEvent.click(screen.getByRole("button", { name: "Xem hiệu quả test" }));
    expect(await screen.findByText("GĐ1")).toBeInTheDocument();
    // "Đạt (win)" xuất hiện cả ở badge lẫn <option> trong select "Đánh giá"
    expect(screen.getAllByText("Đạt (win)").length).toBeGreaterThanOrEqual(1);

    await userEvent.type(screen.getByLabelText("Giai đoạn"), "GĐ2");
    await userEvent.click(screen.getByRole("button", { name: "Ghi nhận test" }));

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/product-performance"),
      expect.objectContaining({ method: "POST" })
    );
  });
});
