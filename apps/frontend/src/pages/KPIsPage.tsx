import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';
import type { CreateKPIInput } from '@fsolution/shared-types';

export default function KPIsPage() {
  const queryClient = useQueryClient();

  const { data: kpis = [], isLoading, isError } = useQuery({
    queryKey: ['kpis'],
    queryFn: apiClient.getKpis
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: apiClient.getEmployees
  });

  const employeeName = (id: string) => employees.find((e) => e.id === id)?.name ?? id;

  const createMutation = useMutation({
    mutationFn: (data: CreateKPIInput) => apiClient.createKpi(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['kpis'] }),
    onError: () => window.alert('Không thể ghi nhận KPI — kiểm tra lại nhân sự đã chọn.')
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newKpi: CreateKPIInput = {
      employeeId: formData.get('employeeId') as string,
      period: formData.get('period') as string,
      score: Number(formData.get('score')),
      bonus: formData.get('bonus') ? Number(formData.get('bonus')) : undefined
    };
    createMutation.mutate(newKpi);
    e.currentTarget.reset();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">KPI</h1>
          <p className="mt-1 text-sm text-gray-500">Chỉ số hiệu suất nhân sự theo kỳ.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 bg-white p-5 rounded-xl shadow-sm border border-gray-100 h-fit">
          <h2 className="text-lg font-medium text-gray-800 mb-4">Ghi nhận KPI</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="kpi-employee" className="block text-sm font-medium text-gray-700 mb-1">Nhân sự</label>
              <select
                id="kpi-employee"
                required
                name="employeeId"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 text-sm cursor-pointer"
              >
                <option value="">-- Chọn nhân sự --</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="kpi-period" className="block text-sm font-medium text-gray-700 mb-1">Kỳ (vd 2026-08)</label>
              <input id="kpi-period" required name="period" type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 text-sm" placeholder="2026-08" />
            </div>
            <div>
              <label htmlFor="kpi-score" className="block text-sm font-medium text-gray-700 mb-1">Điểm số</label>
              <input id="kpi-score" required name="score" type="number" step="0.1" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 text-sm" placeholder="8.5" />
            </div>
            <div>
              <label htmlFor="kpi-bonus" className="block text-sm font-medium text-gray-700 mb-1">Thưởng (VNĐ)</label>
              <input id="kpi-bonus" name="bonus" type="number" min="0" step="10000" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 text-sm" placeholder="1000000" />
            </div>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              {createMutation.isPending ? 'Đang lưu...' : 'Ghi nhận'}
            </button>
          </form>
        </div>

        <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-lg font-medium text-gray-800">Danh sách KPI</h2>
          </div>

          <div className="overflow-auto max-h-[72vh]">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nhân sự</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kỳ</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Điểm số</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thưởng</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading && (
                  <tr><td colSpan={4} className="px-5 py-4 text-center text-sm text-gray-500">Đang tải dữ liệu...</td></tr>
                )}
                {isError && (
                  <tr><td colSpan={4} className="px-5 py-4 text-center text-sm text-red-500">Lỗi khi tải danh sách KPI</td></tr>
                )}
                {!isLoading && kpis.length === 0 && (
                  <tr><td colSpan={4} className="px-5 py-8 text-center text-sm text-gray-500">Chưa có dữ liệu.</td></tr>
                )}
                {kpis.map((kpi) => (
                  <tr key={kpi.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {employeeName(kpi.employeeId)}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500">{kpi.period}</td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{kpi.score}</td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {kpi.bonus != null ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(kpi.bonus) : '—'}
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
