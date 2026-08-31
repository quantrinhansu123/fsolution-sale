import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';
import type { CreateEmployeeInput, EmployeeRole, EmployeeStatus } from '@fsolution/shared-types';

const ROLE_LABEL: Record<EmployeeRole, string> = {
  MKT: 'Marketing',
  Sale: 'Sale',
  CS: 'CS',
  CSKH: 'CSKH',
  KeToan: 'Kế toán',
  Admin: 'Admin'
};

const EMPLOYEE_ROLES: EmployeeRole[] = ['MKT', 'Sale', 'CS', 'CSKH', 'KeToan', 'Admin'];

export default function EmployeesPage() {
  const queryClient = useQueryClient();

  const { data: employees = [], isLoading, isError } = useQuery({
    queryKey: ['employees'],
    queryFn: apiClient.getEmployees
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['employees'] });

  const createMutation = useMutation({
    mutationFn: (data: CreateEmployeeInput) => apiClient.createEmployee(data),
    onSuccess: invalidate,
    onError: () => window.alert('Email đã tồn tại, vui lòng dùng email khác.')
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: EmployeeStatus }) =>
      apiClient.updateEmployee(id, { status }),
    onSuccess: invalidate
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newEmployee: CreateEmployeeInput = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      role: formData.get('role') as EmployeeRole,
      team: (formData.get('team') as string) || undefined,
      branch: (formData.get('branch') as string) || undefined
    };
    createMutation.mutate(newEmployee);
    e.currentTarget.reset();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Nhân sự</h1>
          <p className="mt-1 text-sm text-gray-500">Hồ sơ nhân sự nghiệp vụ — khác tài khoản đăng nhập.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 bg-white p-5 rounded-xl shadow-sm border border-gray-100 h-fit">
          <h2 className="text-lg font-medium text-gray-800 mb-4">Tạo hồ sơ nhân sự</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="employee-name" className="block text-sm font-medium text-gray-700 mb-1">Họ tên</label>
              <input id="employee-name" required name="name" type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 text-sm" placeholder="Nguyễn Văn A" />
            </div>
            <div>
              <label htmlFor="employee-email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input id="employee-email" required name="email" type="email" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 text-sm" placeholder="a.nguyen@fsolution.vn" />
            </div>
            <div>
              <label htmlFor="employee-role" className="block text-sm font-medium text-gray-700 mb-1">Vai trò</label>
              <select id="employee-role" required name="role" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 text-sm cursor-pointer">
                {EMPLOYEE_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {ROLE_LABEL[role]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="employee-team" className="block text-sm font-medium text-gray-700 mb-1">Team</label>
              <input id="employee-team" name="team" type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 text-sm" placeholder="Team A" />
            </div>
            <div>
              <label htmlFor="employee-branch" className="block text-sm font-medium text-gray-700 mb-1">Chi nhánh</label>
              <input id="employee-branch" name="branch" type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 text-sm" placeholder="HN" />
            </div>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              {createMutation.isPending ? 'Đang lưu...' : 'Tạo hồ sơ'}
            </button>
          </form>
        </div>

        <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-lg font-medium text-gray-800">Danh sách nhân sự</h2>
          </div>

          <div className="overflow-auto max-h-[72vh]">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nhân sự</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vai trò</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team / Chi nhánh</th>
                  <th className="px-5 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading && (
                  <tr><td colSpan={4} className="px-5 py-4 text-center text-sm text-gray-500">Đang tải dữ liệu...</td></tr>
                )}
                {isError && (
                  <tr><td colSpan={4} className="px-5 py-4 text-center text-sm text-red-500">Lỗi khi tải danh sách nhân sự</td></tr>
                )}
                {!isLoading && employees.length === 0 && (
                  <tr><td colSpan={4} className="px-5 py-8 text-center text-sm text-gray-500">Chưa có dữ liệu.</td></tr>
                )}
                {employees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                      <div className="text-sm text-gray-500">{employee.email}</div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500">
                      {ROLE_LABEL[employee.role]}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500">
                      {[employee.team, employee.branch].filter(Boolean).join(' · ') || '—'}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            employee.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {employee.status === 'active' ? 'Đang làm việc' : 'Nghỉ việc'}
                        </span>
                        <select
                          aria-label={`Đổi trạng thái nhân sự ${employee.name}`}
                          value={employee.status}
                          onChange={(e) =>
                            updateStatusMutation.mutate({ id: employee.id, status: e.target.value as EmployeeStatus })
                          }
                          className="text-xs border border-gray-300 rounded-md px-1.5 py-1 bg-white focus:ring-amber-500 focus:border-amber-500 cursor-pointer"
                        >
                          <option value="active">active</option>
                          <option value="inactive">inactive</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
