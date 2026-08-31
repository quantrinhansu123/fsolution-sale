import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import EmployeesPage from "../src/pages/EmployeesPage";

let employees: Array<Record<string, unknown>> = [];

beforeEach(() => {
  employees = [
    { id: "1", name: "Nguyễn Văn A", email: "a@fsolution.vn", role: "Sale", status: "active", team: "Team A", branch: "HN", createdAt: "2026-01-01T00:00:00.000Z" }
  ];

  vi.stubGlobal(
    "fetch",
    vi.fn((_url: string, init?: RequestInit) => {
      if (init?.method === "POST") {
        const created = { id: "2", ...JSON.parse(init.body as string), status: "active", createdAt: "2026-01-02T00:00:00.000Z" };
        employees.push(created);
        return Promise.resolve({ ok: true, status: 201, json: () => Promise.resolve(created) });
      }
      if (init?.method === "PATCH") {
        employees[0] = { ...employees[0], ...JSON.parse(init.body as string) };
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(employees[0]) });
      }
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(employees) });
    }) as unknown as typeof fetch
  );
});

describe("EmployeesPage", () => {
  it("hiển thị danh sách nhân sự và tạo mới qua form", async () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <EmployeesPage />
      </QueryClientProvider>
    );

    expect(await screen.findByText("Nguyễn Văn A")).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText("Họ tên"), "Trần Thị B");
    await userEvent.type(screen.getByLabelText("Email"), "b@fsolution.vn");
    await userEvent.click(screen.getByRole("button", { name: "Tạo hồ sơ" }));

    expect(await screen.findByText("Trần Thị B")).toBeInTheDocument();
  });

  it("đổi trạng thái nhân sự qua select gọi PATCH", async () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <EmployeesPage />
      </QueryClientProvider>
    );

    await screen.findByText("Nguyễn Văn A");
    await userEvent.selectOptions(screen.getByLabelText("Đổi trạng thái nhân sự Nguyễn Văn A"), "inactive");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/employees/1"),
      expect.objectContaining({ method: "PATCH" })
    );
  });
});
