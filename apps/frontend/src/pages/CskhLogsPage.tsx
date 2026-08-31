import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';
import type { CreateCskhLogInput } from '@fsolution/shared-types';
import { DateRangeExportBar } from '../components/DateRangeExportBar';
import { useDateRangeFilter } from '../hooks/useDateRangeFilter';
import { exportRowsToExcel } from '../utils/excelExport';

const STATUS_LABEL: Record<string, string> = {
  called: 'Đã gọi',
  upsell: 'Upsell',
  cross_sell: 'Cross-sell',
  no_answer: 'Không nghe máy'
};

export default function CskhLogsPage() {
  const queryClient = useQueryClient();

  const { data: logs = [], isLoading, isError } = useQuery({
    queryKey: ['cskh-logs'],
    queryFn: apiClient.getCskhLogs
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: apiClient.getOrders
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: apiClient.getCustomers
  });

  const customerName = (id: string) => customers.find((c) => c.id === id)?.name ?? id;

  const { fromDate, setFromDate, toDate, setToDate, filtered: filteredLogs } = useDateRangeFilter(
    logs,
    (log) => log.createdAt
  );

  function handleExport() {
    const rows = filteredLogs.map((log) => ({
      'Hợp đồng': log.orderId,
      'Khách hàng': customerName(log.customerId),
      'Kết quả': STATUS_LABEL[log.status] ?? log.status,
      'Ghi chú': log.note ?? '',
      'Ngày': new Date(log.createdAt).toLocaleString('vi-VN')
    }));
    exportRowsToExcel(rows, 'lich-su-cham-soc', 'Chăm sóc khách hàng');
  }

  const createMutation = useMutation({
    mutationFn: (data: CreateCskhLogInput) => apiClient.createCskhLog(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cskh-logs'] }),
    onError: () => window.alert('Không thể ghi nhận — kiểm tra lại hợp đồng/khách hàng đã chọn.')
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newLog: CreateCskhLogInput = {
      orderId: formData.get('orderId') as string,
      customerId: formData.get('customerId') as string,
      staffId: (formData.get('staffId') as string) || undefined,
      status: formData.get('status') as string,
      note: (formData.get('note') as string) || undefined
    };
    createMutation.mutate(newLog);
    e.currentTarget.reset();
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Chăm sóc khách hàng</h1>
          <p className="mt-1 text-sm text-gray-500">Ghi nhận cuộc gọi xác nhận, upsell/cross-sell sau bán.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 bg-white p-5 rounded-xl shadow-sm border border-gray-100 h-fit">
          <h2 className="text-lg font-medium text-gray-800 mb-4">Ghi nhận chăm sóc</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="cskh-order-id" className="block text-sm font-medium text-gray-700 mb-1">Hợp đồng</label>
              <select
                id="cskh-order-id"
                required
                name="orderId"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm cursor-pointer"
              >
                <option value="">-- Chọn hợp đồng --</option>
                {orders.map((order) => (
                  <option key={order.id} value={order.id}>
                    #{order.id.slice(0, 8)} — {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalAmount)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="cskh-customer-id" className="block text-sm font-medium text-gray-700 mb-1">Khách hàng</label>
              <select
                id="cskh-customer-id"
                required
                name="customerId"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm cursor-pointer"
              >
                <option value="">-- Chọn khách hàng --</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} — {customer.phone}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="cskh-status" className="block text-sm font-medium text-gray-700 mb-1">Kết quả</label>
              <select id="cskh-status" required name="status" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 text-sm cursor-pointer">
                <option value="called">Đã gọi</option>
                <option value="upsell">Upsell</option>
                <option value="cross_sell">Cross-sell</option>
                <option value="no_answer">Không nghe máy</option>
              </select>
            </div>
            <div>
              <label htmlFor="cskh-note" className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
              <input id="cskh-note" name="note" type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 text-sm" placeholder="Khách hài lòng, hẹn gọi lại sau" />
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
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-medium text-gray-800">Lịch sử chăm sóc</h2>
            <DateRangeExportBar
              idPrefix="cskh-logs"
              fromDate={fromDate}
              toDate={toDate}
              onFromDateChange={setFromDate}
              onToDateChange={setToDate}
              onExport={handleExport}
              exportDisabled={filteredLogs.length === 0}
            />
          </div>

          <div className="overflow-auto max-h-[65vh]">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hợp đồng</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Khách hàng</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kết quả</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ghi chú</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading && (
                  <tr><td colSpan={5} className="px-5 py-4 text-center text-sm text-gray-500">Đang tải dữ liệu...</td></tr>
                )}
                {isError && (
                  <tr><td colSpan={5} className="px-5 py-4 text-center text-sm text-red-500">Lỗi khi tải lịch sử chăm sóc</td></tr>
                )}
                {!isLoading && filteredLogs.length === 0 && (
                  <tr><td colSpan={5} className="px-5 py-8 text-center text-sm text-gray-500">Chưa có dữ liệu.</td></tr>
                )}
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{log.orderId.slice(0, 8)}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500">
                      {customerName(log.customerId)}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {STATUS_LABEL[log.status] ?? log.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500">{log.note ?? '—'}</td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(log.createdAt).toLocaleString('vi-VN')}
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
