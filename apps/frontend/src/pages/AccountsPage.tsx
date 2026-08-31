import { useState, Fragment } from "react";
import type { FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AccountProfile, Permission } from "@fsolution/shared-types";
import { apiClient } from "../services/apiClient";
import { usePermission } from "../hooks/usePermission";
import { useAuthStore } from "../store/useAuthStore";

const DEFAULT_PASSWORD_HINT = "abc123";

// Đúng theo cây thư mục Chức năng của toàn hệ thống — mỗi key khớp 1-1 với hằng số
// MODULE ở @RequirePermission() phía backend (không gồm "dashboard", vì module đó
// chỉ admin xem được, không cấp quyền qua Ma trận quyền — xem README.md).
const MODULE_GROUPS: { category: string; modules: { key: string; label: string }[] }[] = [
  {
    category: "CRM & Sales",
    modules: [
      { key: "leads", label: "Khách hàng tiềm năng" },
      { key: "orders", label: "Hợp đồng" },
      { key: "customers", label: "Khách hàng" },
      { key: "sale-reports", label: "Báo cáo Sale" },
    ],
  },
  {
    category: "Marketing",
    modules: [
      { key: "campaigns", label: "Chiến dịch" },
      { key: "marketing-reports", label: "Báo cáo Marketing" },
    ],
  },
  {
    category: "CSKH & R&D",
    modules: [
      { key: "cskh-logs", label: "Chăm sóc khách hàng" },
      { key: "products", label: "Sản phẩm" },
      { key: "feedbacks", label: "Phản hồi khách hàng" },
    ],
  },
  {
    category: "Kế toán & Tài chính",
    modules: [
      { key: "payments", label: "Thu tiền" },
      { key: "cash-accounts", label: "Mã tài khoản" },
      { key: "cash-transactions", label: "Sổ quỹ" },
    ],
  },
  {
    category: "HR & Admin",
    modules: [
      { key: "employees", label: "Nhân sự" },
      { key: "kpis", label: "KPI" },
      { key: "system-config", label: "Cấu hình hệ thống" },
      { key: "audit-logs", label: "Nhật ký hệ thống" },
      { key: "account-management", label: "Quản lý tài khoản" },
    ],
  },
];

const MODULES: { key: string; label: string }[] = MODULE_GROUPS.flatMap((g) => g.modules);

function emptyMatrix(): Record<string, Permission> {
  const matrix: Record<string, Permission> = {};
  for (const m of MODULES) matrix[m.key] = { module: m.key, canView: false, canEdit: false, canDelete: false };
  return matrix;
}

function matrixFrom(account: AccountProfile): Record<string, Permission> {
  const matrix = emptyMatrix();
  for (const p of account.permissions ?? []) {
    if (matrix[p.module]) matrix[p.module] = { ...p };
  }
  return matrix;
}

export default function AccountsPage() {
  const canView = usePermission("account-management", "view");
  const canEdit = usePermission("account-management", "edit");
  const canDelete = usePermission("account-management", "delete");
  const queryClient = useQueryClient();
  const currentAccount = useAuthStore((s) => s.account);

  const { data: accounts = [], isLoading, isError } = useQuery({
    queryKey: ["accounts"],
    queryFn: apiClient.getAccounts,
    enabled: canView
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: apiClient.getEmployees,
    enabled: canView
  });
  const unlinkedEmployees = employees.filter((e) => !e.accountId);

  const [newUsername, setNewUsername] = useState("");
  const [newAccountPassword, setNewAccountPassword] = useState("");
  const [newAccountEmployeeId, setNewAccountEmployeeId] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [matrix, setMatrix] = useState<Record<string, Permission>>(emptyMatrix());
  const [actionError, setActionError] = useState<string | null>(null);

  const [resetTargetId, setResetTargetId] = useState<string | null>(null);
  const [resetPasswordInput, setResetPasswordInput] = useState("");
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["accounts"] });
  const invalidateEmployees = () => queryClient.invalidateQueries({ queryKey: ["employees"] });

  const createMutation = useMutation({
    mutationFn: async ({ username, password, employeeId }: { username: string; password: string; employeeId: string }) => {
      const account = await apiClient.createAccount({ username, password: password || undefined });
      if (employeeId) await apiClient.updateEmployee(employeeId, { accountId: account.id });
      return account;
    },
    onSuccess: () => {
      setNewUsername("");
      setNewAccountPassword("");
      setNewAccountEmployeeId("");
      invalidate();
      invalidateEmployees();
    },
    onError: () => setActionError("Không tạo được tài khoản (tên có thể đã tồn tại)")
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, password }: { id: string; password?: string }) =>
      password ? apiClient.updateAccount(id, { newPassword: password }) : apiClient.updateAccount(id, { resetPassword: true }),
    onSuccess: (account, variables) => {
      setResetMessage(
        variables.password
          ? `Đã đặt mật khẩu mới cho "${account.username}". Hãy báo mật khẩu này cho người dùng.`
          : `Đã đặt lại mật khẩu cho "${account.username}" về mặc định: ${DEFAULT_PASSWORD_HINT}`
      );
      setResetPasswordInput("");
      invalidate();
    },
    onError: () => setResetMessage("Không đặt lại được mật khẩu, vui lòng thử lại")
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.deleteAccount(id),
    onSuccess: invalidate,
    onError: () => setActionError("Không thể xoá tài khoản admin cuối cùng")
  });

  const setPermissionsMutation = useMutation({
    mutationFn: (id: string) => apiClient.setAccountPermissions(id, Object.values(matrix)),
    onSuccess: () => {
      setEditingId(null);
      invalidate();
    }
  });

  function handleCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setActionError(null);
    if (newUsername.trim()) {
      createMutation.mutate({
        username: newUsername.trim(),
        password: newAccountPassword.trim(),
        employeeId: newAccountEmployeeId
      });
    }
  }

  function openMatrix(account: AccountProfile) {
    setEditingId(account.id);
    setMatrix(matrixFrom(account));
  }

  function openReset(accountId: string) {
    setResetMessage(null);
    setResetPasswordInput("");
    setResetTargetId(accountId);
  }

  function closeReset() {
    setResetTargetId(null);
    setResetPasswordInput("");
  }

  function toggleCell(module: string, field: "canView" | "canEdit" | "canDelete") {
    setMatrix((prev) => ({ ...prev, [module]: { ...prev[module], [field]: !prev[module][field] } }));
  }


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Quản lý tài khoản</h1>
        <p className="mt-1 text-sm text-gray-500">Tài khoản và phân quyền theo từng chức năng.</p>
      </div>

      

      {!canView && (
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 text-sm text-gray-500">
          Bạn không có quyền xem Quản lý tài khoản.
        </div>
      )}

      {canView && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {canEdit && (
            <div className="md:col-span-1 bg-white p-5 rounded-xl shadow-sm border border-gray-100 h-fit">
              <h2 className="text-lg font-medium text-gray-800 mb-4">Tạo tài khoản mới</h2>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label htmlFor="new-account-username" className="block text-sm font-medium text-gray-700 mb-1">
                    Tên tài khoản
                  </label>
                  <input
                    id="new-account-username"
                    required
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 text-sm"
                    placeholder="vd: warehouse"
                  />
                </div>
                <div>
                  <label htmlFor="new-account-password" className="block text-sm font-medium text-gray-700 mb-1">
                    Mật khẩu
                  </label>
                  <input
                    id="new-account-password"
                    type="text"
                    minLength={6}
                    value={newAccountPassword}
                    onChange={(e) => setNewAccountPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 text-sm"
                    placeholder="Bỏ trống để dùng mặc định"
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    Bỏ trống thì mật khẩu mặc định là "{DEFAULT_PASSWORD_HINT}" (tối thiểu 6 ký tự nếu tự đặt).
                  </p>
                </div>
                <div>
                  <label htmlFor="new-account-employee" className="block text-sm font-medium text-gray-700 mb-1">
                    Tên nhân viên
                  </label>
                  <select
                    id="new-account-employee"
                    value={newAccountEmployeeId}
                    onChange={(e) => setNewAccountEmployeeId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 text-sm cursor-pointer"
                  >
                    <option value="">-- Không liên kết nhân sự --</option>
                    {unlinkedEmployees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-400">
                    Chỉ hiện nhân sự chưa gắn tài khoản. Tạo hồ sơ nhân sự mới ở trang Nhân sự.
                  </p>
                </div>
                {actionError && <p className="text-sm text-red-600">{actionError}</p>}
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                >
                  {createMutation.isPending ? "Đang tạo..." : "Tạo tài khoản"}
                </button>
              </form>
            </div>
          )}

          <div className={canEdit ? "md:col-span-2 space-y-4" : "md:col-span-3 space-y-4"}>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                <h2 className="text-lg font-medium text-gray-800">Danh sách tài khoản</h2>
              </div>
              <div className="overflow-auto max-h-[72vh]">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tài khoản</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên nhân viên</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vai trò</th>
                      <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {isLoading && (
                      <tr><td colSpan={4} className="px-5 py-4 text-center text-sm text-gray-500">Đang tải dữ liệu...</td></tr>
                    )}
                    {isError && (
                      <tr><td colSpan={4} className="px-5 py-4 text-center text-sm text-red-500">Lỗi khi tải danh sách tài khoản</td></tr>
                    )}
                    {accounts.map((account) => (
                      <tr key={account.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {account.username}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500">
                          {account.employeeName ?? '—'}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              account.isAdmin ? "bg-amber-100 text-amber-800" : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {account.isAdmin ? "Admin (toàn quyền)" : "Tài khoản chức năng"}
                          </span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-right text-sm space-x-3">
                          {canEdit && !account.isAdmin && (
                            <button
                              onClick={() => openMatrix(account)}
                              className="text-amber-700 hover:text-amber-800 cursor-pointer"
                            >
                              Phân quyền
                            </button>
                          )}
                          {canEdit && (
                            <button
                              onClick={() => openReset(account.id)}
                              className="text-gray-600 hover:text-gray-900 cursor-pointer"
                            >
                              Đặt lại mật khẩu
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => {
                                setActionError(null);
                                deleteMutation.mutate(account.id);
                              }}
                              className="text-red-600 hover:text-red-800 cursor-pointer"
                            >
                              Xoá
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {editingId && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <h3 className="text-sm font-medium text-gray-800 mb-4">
                  Ma trận quyền — {accounts.find((a) => a.id === editingId)?.username}
                </h3>
                <div className="overflow-auto max-h-[72vh]">
                  <table className="min-w-full text-sm">
                    <thead className="bg-white sticky top-0 z-10">
                      <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <th className="py-2 pr-4">Chức năng</th>
                        <th className="py-2 px-4 text-center">Xem</th>
                        <th className="py-2 px-4 text-center">Sửa</th>
                        <th className="py-2 px-4 text-center">Xoá</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {MODULE_GROUPS.map((group) => (
                        <Fragment key={group.category}>
                          <tr>
                            <td
                              colSpan={4}
                              className="py-2 pr-4 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50"
                            >
                              {group.category}
                            </td>
                          </tr>
                          {group.modules.map((m) => (
                            <tr key={m.key}>
                              <td className="py-2 pr-4 pl-4 text-gray-700">{m.label}</td>
                              {(["canView", "canEdit", "canDelete"] as const).map((field) => (
                                <td key={field} className="py-2 px-4 text-center">
                                  <input
                                    type="checkbox"
                                    checked={matrix[m.key][field]}
                                    onChange={() => toggleCell(m.key, field)}
                                    className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                                  />
                                </td>
                              ))}
                            </tr>
                          ))}
                        </Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() => setPermissionsMutation.mutate(editingId)}
                    disabled={setPermissionsMutation.isPending}
                    className="py-2 px-4 rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {setPermissionsMutation.isPending ? "Đang lưu..." : "Lưu quyền"}
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="py-2 px-4 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-50 cursor-pointer"
                  >
                    Huỷ
                  </button>
                </div>
              </div>
            )}

            {resetTargetId && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 max-w-md">
                <h3 className="text-sm font-medium text-gray-800 mb-4">
                  Đặt lại mật khẩu — {accounts.find((a) => a.id === resetTargetId)?.username}
                </h3>
                <div className="space-y-3">
                  <div>
                    <label htmlFor="reset-password-input" className="block text-sm font-medium text-gray-700 mb-1">
                      Mật khẩu mới (tuỳ chọn)
                    </label>
                    <input
                      id="reset-password-input"
                      type="text"
                      minLength={6}
                      value={resetPasswordInput}
                      onChange={(e) => setResetPasswordInput(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 text-sm"
                      placeholder={`Bỏ trống để đặt về mặc định "${DEFAULT_PASSWORD_HINT}"`}
                    />
                  </div>
                  {resetMessage && (
                    <p className={`text-sm ${resetMessage.startsWith("Không") ? "text-red-600" : "text-emerald-600"}`}>
                      {resetMessage}
                    </p>
                  )}
                  <div className="flex gap-3">
                    <button
                      onClick={() =>
                        resetPasswordMutation.mutate({
                          id: resetTargetId,
                          password: resetPasswordInput.trim() || undefined
                        })
                      }
                      disabled={resetPasswordMutation.isPending || (resetPasswordInput.trim().length > 0 && resetPasswordInput.trim().length < 6)}
                      className="py-2 px-4 rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                    >
                      {resetPasswordMutation.isPending
                        ? "Đang đặt lại..."
                        : resetPasswordInput.trim()
                          ? "Đặt mật khẩu này"
                          : `Đặt về mặc định (${DEFAULT_PASSWORD_HINT})`}
                    </button>
                    <button
                      onClick={closeReset}
                      className="py-2 px-4 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-50 cursor-pointer"
                    >
                      Đóng
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
