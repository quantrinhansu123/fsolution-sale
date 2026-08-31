import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';
import type { CashAccountType, CreateCashAccountInput } from '@fsolution/shared-types';

const TYPE_LABEL: Record<CashAccountType, string> = {
  income: 'Thu',
  expense: 'Chi'
};

const TYPE_CLASS: Record<CashAccountType, string> = {
  income: 'bg-emerald-100 text-emerald-800',
  expense: 'bg-red-100 text-red-800'
};

export default function CashAccountsPage() {
  const queryClient = useQueryClient();

  const { data: cashAccounts = [], isLoading, isError } = useQuery({
    queryKey: ['cash-accounts'],
    queryFn: apiClient.getCashAccounts
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateCashAccountInput) => apiClient.createCashAccount(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cash-accounts'] }),
    onError: () => window.alert('Mã tài khoản đã tồn tại, vui lòng chọn mã khác.')
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newCashAccount: CreateCashAccountInput = {
      code: formData.get('code') as string,
      name: formData.get('name') as string,
      type: formData.get('type') as CashAccountType,
      branch: (formData.get('branch') as string) || undefined,
      market: (formData.get('market') as string) || undefined
    };
    createMutation.mutate(newCashAccount);
    e.currentTarget.reset();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Mã tài khoản Thu/Chi</h1>
          <p className="mt-1 text-sm text-gray-500">Danh mục do Admin khai báo, dùng làm dropdown khi ghi sổ quỹ.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 bg-white p-5 rounded-xl shadow-sm border border-gray-100 h-fit">
          <h2 className="text-lg font-medium text-gray-800 mb-4">Tạo mã tài khoản</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="cash-account-code" className="block text-sm font-medium text-gray-700 mb-1">Mã</label>
              <input id="cash-account-code" required name="code" type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 text-sm" placeholder="1.1US" />
            </div>
            <div>
              <label htmlFor="cash-account-name" className="block text-sm font-medium text-gray-700 mb-1">Tên tài khoản</label>
              <input id="cash-account-name" required name="name" type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 text-sm" placeholder="Quỹ tiền mặt US" />
            </div>
            <div>
              <label htmlFor="cash-account-type" className="block text-sm font-medium text-gray-700 mb-1">Loại</label>
              <select id="cash-account-type" required name="type" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 text-sm cursor-pointer">
                <option value="income">Thu</option>
                <option value="expense">Chi</option>
              </select>
            </div>
            <div>
              <label htmlFor="cash-account-branch" className="block text-sm font-medium text-gray-700 mb-1">Chi nhánh</label>
              <input id="cash-account-branch" name="branch" type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 text-sm" placeholder="HN" />
            </div>
            <div>
              <label htmlFor="cash-account-market" className="block text-sm font-medium text-gray-700 mb-1">Thị trường</label>
              <input id="cash-account-market" name="market" type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 text-sm" placeholder="US" />
            </div>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              {createMutation.isPending ? 'Đang lưu...' : 'Tạo mã tài khoản'}
            </button>
          </form>
        </div>

        <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-lg font-medium text-gray-800">Danh sách mã tài khoản</h2>
          </div>

          <div className="overflow-auto max-h-[72vh]">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tài khoản</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loại</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chi nhánh / Thị trường</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading && (
                  <tr><td colSpan={3} className="px-5 py-4 text-center text-sm text-gray-500">Đang tải dữ liệu...</td></tr>
                )}
                {isError && (
                  <tr><td colSpan={3} className="px-5 py-4 text-center text-sm text-red-500">Lỗi khi tải danh sách mã tài khoản</td></tr>
                )}
                {!isLoading && cashAccounts.length === 0 && (
                  <tr><td colSpan={3} className="px-5 py-8 text-center text-sm text-gray-500">Chưa có dữ liệu.</td></tr>
                )}
                {cashAccounts.map((account) => (
                  <tr key={account.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{account.name}</div>
                      <div className="text-sm text-gray-500">{account.code}</div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${TYPE_CLASS[account.type]}`}>
                        {TYPE_LABEL[account.type]}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500">
                      {[account.branch, account.market].filter(Boolean).join(' · ') || '—'}
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
