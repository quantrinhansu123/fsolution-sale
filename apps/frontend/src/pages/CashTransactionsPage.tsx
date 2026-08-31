import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';
import type { CashAccountType, CreateCashTransactionInput } from '@fsolution/shared-types';
import { DateRangeExportBar } from '../components/DateRangeExportBar';
import { useDateRangeFilter } from '../hooks/useDateRangeFilter';
import { exportRowsToExcel } from '../utils/excelExport';

const TYPE_LABEL: Record<CashAccountType, string> = {
  income: 'Thu',
  expense: 'Chi'
};

const TYPE_CLASS: Record<CashAccountType, string> = {
  income: 'bg-emerald-100 text-emerald-800',
  expense: 'bg-red-100 text-red-800'
};

export default function CashTransactionsPage() {
  const queryClient = useQueryClient();

  const { data: transactions = [], isLoading, isError } = useQuery({
    queryKey: ['cash-transactions'],
    queryFn: apiClient.getCashTransactions
  });

  const { data: cashAccounts = [] } = useQuery({
    queryKey: ['cash-accounts'],
    queryFn: apiClient.getCashAccounts
  });

  const { fromDate, setFromDate, toDate, setToDate, filtered: filteredTransactions } = useDateRangeFilter(
    transactions,
    (tx) => tx.transactionDate
  );

  function handleExport() {
    const rows = filteredTransactions.map((tx) => ({
      'Nội dung': tx.content,
      'Loại': TYPE_LABEL[tx.type],
      'Số tiền': tx.amount,
      'Chi nhánh': tx.branch ?? '',
      'Thị trường': tx.market ?? '',
      'Nguồn': tx.source ?? '',
      'Ngày': new Date(tx.transactionDate).toLocaleDateString('vi-VN')
    }));
    exportRowsToExcel(rows, 'lich-su-so-quy', 'Sổ quỹ');
  }

  const createMutation = useMutation({
    mutationFn: (data: CreateCashTransactionInput) => apiClient.createCashTransaction(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cash-transactions'] })
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newTransaction: CreateCashTransactionInput = {
      cashAccountId: formData.get('cashAccountId') as string,
      type: formData.get('type') as CashAccountType,
      content: formData.get('content') as string,
      amount: Number(formData.get('amount')),
      transactionDate: formData.get('transactionDate') as string,
      branch: (formData.get('branch') as string) || undefined,
      market: (formData.get('market') as string) || undefined,
      source: (formData.get('source') as string) || undefined
    };
    createMutation.mutate(newTransaction);
    e.currentTarget.reset();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Sổ quỹ</h1>
          <p className="mt-1 text-sm text-gray-500">Ghi nhận dòng Thu/Chi theo mã tài khoản, chi nhánh/thị trường.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 bg-white p-5 rounded-xl shadow-sm border border-gray-100 h-fit">
          <h2 className="text-lg font-medium text-gray-800 mb-4">Ghi sổ quỹ</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="cashtx-account" className="block text-sm font-medium text-gray-700 mb-1">Mã tài khoản</label>
              <select
                id="cashtx-account"
                required
                name="cashAccountId"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 text-sm cursor-pointer"
              >
                <option value="">-- Chọn mã tài khoản --</option>
                {cashAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.code} — {account.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="cashtx-type" className="block text-sm font-medium text-gray-700 mb-1">Loại</label>
              <select id="cashtx-type" required name="type" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 text-sm cursor-pointer">
                <option value="income">Thu</option>
                <option value="expense">Chi</option>
              </select>
            </div>
            <div>
              <label htmlFor="cashtx-content" className="block text-sm font-medium text-gray-700 mb-1">Nội dung</label>
              <input id="cashtx-content" required name="content" type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 text-sm" placeholder="Thu tiền hợp đồng ORD-001" />
            </div>
            <div>
              <label htmlFor="cashtx-amount" className="block text-sm font-medium text-gray-700 mb-1">Số tiền (VNĐ)</label>
              <input id="cashtx-amount" required name="amount" type="number" min="0" step="1000" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 text-sm" placeholder="1000000" />
            </div>
            <div>
              <label htmlFor="cashtx-date" className="block text-sm font-medium text-gray-700 mb-1">Ngày giao dịch</label>
              <input id="cashtx-date" required name="transactionDate" type="date" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 text-sm" />
            </div>
            <div>
              <label htmlFor="cashtx-branch" className="block text-sm font-medium text-gray-700 mb-1">Chi nhánh</label>
              <input id="cashtx-branch" name="branch" type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 text-sm" placeholder="HN" />
            </div>
            <div>
              <label htmlFor="cashtx-market" className="block text-sm font-medium text-gray-700 mb-1">Thị trường</label>
              <input id="cashtx-market" name="market" type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 text-sm" placeholder="US" />
            </div>
            <div>
              <label htmlFor="cashtx-source" className="block text-sm font-medium text-gray-700 mb-1">Nguồn</label>
              <input id="cashtx-source" name="source" type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 text-sm" placeholder="CK về TK Công ty" />
            </div>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              {createMutation.isPending ? 'Đang lưu...' : 'Ghi sổ'}
            </button>
          </form>
        </div>

        <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-medium text-gray-800">Lịch sử sổ quỹ</h2>
            <DateRangeExportBar
              idPrefix="cash-tx"
              fromDate={fromDate}
              toDate={toDate}
              onFromDateChange={setFromDate}
              onToDateChange={setToDate}
              onExport={handleExport}
              exportDisabled={filteredTransactions.length === 0}
            />
          </div>

          <div className="overflow-auto max-h-[72vh]">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nội dung</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loại</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Số tiền</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading && (
                  <tr><td colSpan={4} className="px-5 py-4 text-center text-sm text-gray-500">Đang tải dữ liệu...</td></tr>
                )}
                {isError && (
                  <tr><td colSpan={4} className="px-5 py-4 text-center text-sm text-red-500">Lỗi khi tải sổ quỹ</td></tr>
                )}
                {!isLoading && filteredTransactions.length === 0 && (
                  <tr><td colSpan={4} className="px-5 py-8 text-center text-sm text-gray-500">Chưa có dữ liệu.</td></tr>
                )}
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 text-sm text-gray-900">
                      {tx.content}
                      {(tx.branch || tx.market) && (
                        <div className="text-xs text-gray-500">{[tx.branch, tx.market].filter(Boolean).join(' · ')}</div>
                      )}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${TYPE_CLASS[tx.type]}`}>
                        {TYPE_LABEL[tx.type]}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(tx.amount)}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(tx.transactionDate).toLocaleDateString('vi-VN')}
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
