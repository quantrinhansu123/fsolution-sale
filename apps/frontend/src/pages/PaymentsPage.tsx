import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';
import type { CreatePaymentInput, PaymentStatus } from '@fsolution/shared-types';

const STATUS_LABEL: Record<PaymentStatus, string> = {
  pending: 'Chờ thu',
  completed: 'Đã thu (đối soát)',
  failed: 'Thất bại'
};

const STATUS_CLASS: Record<PaymentStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-emerald-100 text-emerald-800',
  failed: 'bg-red-100 text-red-800'
};

const PAYMENT_STATUSES: PaymentStatus[] = ['pending', 'completed', 'failed'];

export default function PaymentsPage() {
  const queryClient = useQueryClient();

  const { data: payments = [], isLoading, isError } = useQuery({
    queryKey: ['payments'],
    queryFn: apiClient.getPayments
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['payments'] });

  const createMutation = useMutation({
    mutationFn: (data: CreatePaymentInput) => apiClient.createPayment(data),
    onSuccess: invalidate
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: PaymentStatus }) =>
      // "completed" bắt buộc kèm bằng chứng đối soát (nguyên tắc #3) — tự ghi thời điểm đối soát ngay lúc đổi trạng thái.
      apiClient.updatePayment(id, { status, ...(status === 'completed' ? { reconciledAt: new Date().toISOString() } : {}) }),
    onSuccess: invalidate
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newPayment: CreatePaymentInput = {
      orderId: formData.get('orderId') as string,
      amount: Number(formData.get('amount')),
      method: (formData.get('method') as string) || undefined
    };
    createMutation.mutate(newPayment);
    e.currentTarget.reset();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Thu tiền</h1>
          <p className="mt-1 text-sm text-gray-500">Ghi nhận khoản thu theo hợp đồng, đối soát bill.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 bg-white p-5 rounded-xl shadow-sm border border-gray-100 h-fit">
          <h2 className="text-lg font-medium text-gray-800 mb-4">Ghi nhận khoản thu</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="payment-order-id" className="block text-sm font-medium text-gray-700 mb-1">Mã Hợp đồng</label>
              <input id="payment-order-id" required name="orderId" type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="ORD-001" />
            </div>
            <div>
              <label htmlFor="payment-amount" className="block text-sm font-medium text-gray-700 mb-1">Số tiền (VNĐ)</label>
              <input id="payment-amount" required name="amount" type="number" min="0" step="1000" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="500000" />
            </div>
            <div>
              <label htmlFor="payment-method" className="block text-sm font-medium text-gray-700 mb-1">Hình thức</label>
              <input id="payment-method" name="method" type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="Chuyển khoản" />
            </div>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              {createMutation.isPending ? 'Đang lưu...' : 'Ghi nhận'}
            </button>
          </form>
        </div>

        <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-lg font-medium text-gray-800">Danh sách khoản thu</h2>
          </div>

          <div className="overflow-auto max-h-[72vh]">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hợp đồng</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Số tiền</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hình thức</th>
                  <th className="px-5 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading && (
                  <tr><td colSpan={4} className="px-5 py-4 text-center text-sm text-gray-500">Đang tải dữ liệu...</td></tr>
                )}
                {isError && (
                  <tr><td colSpan={4} className="px-5 py-4 text-center text-sm text-red-500">Lỗi khi tải danh sách khoản thu</td></tr>
                )}
                {!isLoading && payments.length === 0 && (
                  <tr><td colSpan={4} className="px-5 py-8 text-center text-sm text-gray-500">Chưa có dữ liệu.</td></tr>
                )}
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {payment.orderId}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(payment.amount)}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payment.method ?? '—'}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_CLASS[payment.status]}`}>
                          {STATUS_LABEL[payment.status]}
                        </span>
                        <select
                          aria-label={`Đổi trạng thái khoản thu ${payment.orderId}`}
                          value={payment.status}
                          onChange={(e) =>
                            updateStatusMutation.mutate({ id: payment.id, status: e.target.value as PaymentStatus })
                          }
                          className="text-xs border border-gray-300 rounded-md px-1.5 py-1 bg-white focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                        >
                          {PAYMENT_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
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
