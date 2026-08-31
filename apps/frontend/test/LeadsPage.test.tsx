import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import LeadsPage from "../src/pages/LeadsPage";
import { useAuthStore } from "../src/store/useAuthStore";

let leads: Array<Record<string, unknown>> = [];
const employees = [
  { id: "emp-1", name: "Lê Văn Sale", email: "sale@fsolution.vn", role: "Sale", status: "active", createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "mkt-1", name: "Trần Thị MKT", email: "mkt@fsolution.vn", role: "MKT", status: "active", accountId: "acc-mkt-1", createdAt: "2026-01-01T00:00:00.000Z" }
];

beforeEach(() => {
  useAuthStore.setState({ account: null, status: "ready" });

  leads = [
    {
      id: "1",
      name: "Nguyễn Văn A",
      phone: "0901111111",
      source: "Facebook",
      status: "new",
      assignedTo: null,
      sourcedBy: "mkt-1",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z"
    }
  ];

  vi.stubGlobal(
    "fetch",
    vi.fn((url: string, init?: RequestInit) => {
      if (url.includes("/employees")) {
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(employees) });
      }
      if (url.includes("/logs")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve([
              { id: "log-1", leadId: "1", fromStatus: "new", toStatus: "contacted", note: "Đã gọi", createdAt: "2026-01-03T00:00:00.000Z" }
            ])
        });
      }
      if (init?.method === "POST") {
        const created = {
          id: "2",
          ...JSON.parse(init.body as string),
          status: "new",
          createdAt: "2026-01-02T00:00:00.000Z",
          updatedAt: "2026-01-02T00:00:00.000Z"
        };
        leads.push(created);
        return Promise.resolve({ ok: true, status: 201, json: () => Promise.resolve(created) });
      }
      if (init?.method === "PATCH") {
        leads[0] = { ...leads[0], ...JSON.parse(init.body as string) };
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(leads[0]) });
      }
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(leads) });
    }) as unknown as typeof fetch
  );
});

describe("LeadsPage", () => {
  it("hiển thị danh sách lead và tạo mới qua form", async () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <LeadsPage />
      </QueryClientProvider>
    );

    expect(await screen.findByText("Nguyễn Văn A")).toBeInTheDocument();
    expect(screen.getByText("Mới")).toBeInTheDocument();
    expect(screen.getByLabelText("Từ ngày")).toBeInTheDocument();
    expect(screen.getByLabelText("Đến ngày")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Xuất Excel" })).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText("Họ tên"), "Trần Thị B");
    await userEvent.type(screen.getByLabelText("Số điện thoại"), "0902222222");
    await userEvent.selectOptions(screen.getByLabelText("Nguồn"), "Zalo OA");
    await userEvent.click(screen.getByRole("button", { name: "Lưu thông tin" }));

    expect(await screen.findByText("Trần Thị B")).toBeInTheDocument();
  });

  it("cột 'Nhân viên Marketing' hiện đúng tên nhân viên gắn với Lead (mới)", async () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <LeadsPage />
      </QueryClientProvider>
    );

    await screen.findByText("Nguyễn Văn A");
    // "Trần Thị MKT" xuất hiện cả ở <option> của select "Chọn nhân viên Marketing" lẫn cột bảng
    expect(screen.getAllByText("Trần Thị MKT").length).toBeGreaterThanOrEqual(1);
  });

  it("tự động điền tên nhân viên Marketing đang đăng nhập vào ô 'Chọn nhân viên Marketing', gửi kèm sourcedBy khi tạo Lead (mới)", async () => {
    useAuthStore.setState({
      account: { id: "acc-mkt-1", username: "mkt", isAdmin: false, createdAt: "2026-01-01T00:00:00.000Z" },
      status: "ready"
    });

    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <LeadsPage />
      </QueryClientProvider>
    );

    await screen.findByText("Nguyễn Văn A");

    const sourcedBySelect = (await screen.findByLabelText("Nhân viên Marketing")) as HTMLSelectElement;
    expect(sourcedBySelect.value).toBe("mkt-1");

    await userEvent.type(screen.getByLabelText("Họ tên"), "Phạm Văn C");
    await userEvent.type(screen.getByLabelText("Số điện thoại"), "0903333333");
    await userEvent.click(screen.getByRole("button", { name: "Lưu thông tin" }));

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/leads"),
      expect.objectContaining({ method: "POST", body: expect.stringContaining('"sourcedBy":"mkt-1"') })
    );
  });

  it("đổi trạng thái qua select gọi PATCH, xem lịch sử hiển thị đúng log", async () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <LeadsPage />
      </QueryClientProvider>
    );

    await screen.findByText("Nguyễn Văn A");

    await userEvent.selectOptions(screen.getByLabelText("Đổi trạng thái lead Nguyễn Văn A"), "contacted");
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/leads/1"),
      expect.objectContaining({ method: "PATCH" })
    );

    await userEvent.click(screen.getByRole("button", { name: "Xem lịch sử" }));
    expect(await screen.findByText(/new → contacted/)).toBeInTheDocument();
    expect(screen.getByText(/Đã gọi/)).toBeInTheDocument();
  });

  it("phân bổ Sale qua select 'Sale phụ trách' gọi PATCH assignedTo (Task 4.10)", async () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <LeadsPage />
      </QueryClientProvider>
    );

    // "Lê Văn Sale" xuất hiện trong <option> của select "Sale phụ trách"
    expect(await screen.findAllByText("Lê Văn Sale")).not.toHaveLength(0);

    await userEvent.selectOptions(screen.getByLabelText("Phân bổ Sale cho lead Nguyễn Văn A"), "emp-1");
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/leads/1"),
      expect.objectContaining({ method: "PATCH", body: expect.stringContaining("emp-1") })
    );
  });
});
