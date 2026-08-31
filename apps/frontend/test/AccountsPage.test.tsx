import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AccountsPage from "../src/pages/AccountsPage";
import { useAuthStore } from "../src/store/useAuthStore";

const accounts = [
  { id: "1", username: "admin", isAdmin: true, createdAt: "2026-01-01T00:00:00.000Z", permissions: [] },
  {
    id: "2",
    username: "lead",
    isAdmin: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    permissions: [{ module: "leads", canView: true, canEdit: true, canDelete: true }],
  },
];

function renderPage() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <AccountsPage />
    </QueryClientProvider>
  );
}

describe("AccountsPage", () => {
  beforeEach(() => {
    // admin đăng nhập -> toàn quyền mọi module, bao gồm account-management
    useAuthStore.setState({
      account: { id: "1", username: "admin", isAdmin: true, createdAt: "2026-01-01T00:00:00.000Z" },
      status: "ready",
    });

    vi.stubGlobal(
      "fetch",
      vi.fn((url: string, init?: RequestInit) => {
        if (url.includes("/accounts") && init?.method === "POST") {
          const created = { id: "3", username: "warehouse", isAdmin: false, createdAt: "2026-01-02T00:00:00.000Z" };
          return Promise.resolve({ ok: true, status: 201, json: () => Promise.resolve(created) });
        }
        if (url.includes("/accounts/2") && init?.method === "PATCH") {
          const updated = { ...accounts[1] };
          return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(updated) });
        }
        if (url.includes("/accounts")) {
          return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(accounts) });
        }
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) });
      }) as unknown as typeof fetch
    );
  });

  it("hiển thị danh sách tài khoản đã seed và tạo tài khoản mới qua form", async () => {
    renderPage();

    expect(await screen.findByText("admin")).toBeInTheDocument();
    expect(screen.getByText("lead")).toBeInTheDocument();
    expect(screen.getByText("Admin (toàn quyền)")).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText("Tên tài khoản"), "warehouse");
    await userEvent.click(screen.getByRole("button", { name: "Tạo tài khoản" }));

    expect(
      await screen.findByText('Bỏ trống thì mật khẩu mặc định là "abc123" (tối thiểu 6 ký tự nếu tự đặt).')
    ).toBeInTheDocument();
  });

  it("mở ma trận quyền cho tài khoản chức năng và hiện đúng ô đã cấp quyền", async () => {
    renderPage();

    await screen.findByText("lead");
    await userEvent.click(screen.getAllByText("Phân quyền")[0]);

    expect(await screen.findByText("Ma trận quyền — lead")).toBeInTheDocument();
    const checkboxes = screen.getAllByRole("checkbox");
    // 17 module x 3 cột (view/edit/delete) = 51 checkbox; 3 đầu (module "leads", đầu nhóm CRM & Sales)
    // phải đều checked
    expect(checkboxes).toHaveLength(51);
    expect(checkboxes[0]).toBeChecked();
    expect(checkboxes[1]).toBeChecked();
    expect(checkboxes[2]).toBeChecked();
  });

  it("đặt lại mật khẩu hiện bảng xác nhận và thông báo kết quả rõ ràng", async () => {
    renderPage();

    await screen.findByText("lead");
    // index 0 = admin, index 1 = lead (accounts mock giữ nguyên thứ tự)
    await userEvent.click(screen.getAllByText("Đặt lại mật khẩu")[1]);

    expect(await screen.findByText("Đặt lại mật khẩu — lead")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Đặt về mặc định (abc123)" }));

    expect(
      await screen.findByText('Đã đặt lại mật khẩu cho "lead" về mặc định: abc123')
    ).toBeInTheDocument();
  });
});
