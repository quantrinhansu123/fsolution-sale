import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';
import type { CreateMarketingReportInput } from '@fsolution/shared-types';
import { DateRangeExportBar } from '../components/DateRangeExportBar';
import { useDateRangeFilter } from '../hooks/useDateRangeFilter';
import { exportRowsToExcel } from '../utils/excelExport';
import { today } from '../utils/date';

const currency = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

export default function MarketingReportsPage() {
  const queryClient = useQueryClient();

  const [autoFromDate, setAutoFromDate] = useState(today());
  const [autoToDate, setAutoToDate] = useState(today());

  // Mới — Báo cáo tự động Marketing: doanh thu tính real-time bằng cách map nhân viên Marketing
  // (Lead.sourcedBy) với doanh thu Hợp đồng gắn các Lead đó, không cần nhập tay.
  const { data: autoReports = [], isLoading: isAutoLoading, isError: isAutoError } = useQuery({
    queryKey: ['marketing-reports-auto', autoFromDate, autoToDate],
    queryFn: () => apiClient.getMarketingReportsAuto(autoFromDate, autoToDate)
  });

  function handleExportAuto() {
    const rows = autoReports.map((report) => ({
      'Nhân viên Marketing': report.employeeName,
      'Số Lead': report.leadCount,
      'Số đơn': report.orderCount,
      'Doanh thu': report.revenue
    }));
    exportRowsToExcel(rows, 'bao-cao-tu-dong-marketing', 'Báo cáo tự động Marketing');
  }

  const { data: reports = [], isLoading, isError } = useQuery({
    queryKey: ['marketing-reports'],
    queryFn: apiClient.getMarketingReports
  });

  const { fromDate, setFromDate, toDate, setToDate, filtered: filteredReports } = useDateRangeFilter(
    reports,
    (report) => report.date
  );

  function handleExport() {
    const rows = filteredReports.map((report) => ({
      'Ngày': new Date(report.date).toLocaleDateString('vi-VN'),
      'Ca': report.shift,
      'Team': report.team,
      'Sản phẩm': report.product,
      'Thị trường': report.market,
      'Chi phí Ads': report.adCost,
      'Số Mess': report.messageCount,
      'Số đơn': report.orderCount,
      'Doanh số': report.revenue,
      'Doanh thu thực': report.revenueActual
    }));
    exportRowsToExcel(rows, 'bao-cao-marketing', 'Báo cáo Marketing');
  }

  const createMutation = useMutation({
    mutationFn: (data: CreateMarketingReportInput) => apiClient.createMarketingReport(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['marketing-reports'] })
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newReport: CreateMarketingReportInput = {
      date: formData.get('date') as string,
      shift: formData.get('shift') as string,
      product: formData.get('product') as string,
      market: formData.get('market') as string,
      team: formData.get('team') as string,
      adCost: Number(formData.get('adCost')),
      messageCount: Number(formData.get('messageCount')),
      orderCount: Number(formData.get('orderCount')),
      revenue: Number(formData.get('revenue')),
      revenueActual: Number(formData.get('revenueActual'))
    };
    createMutation.mutate(newReport);
    e.currentTarget.reset();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Báo cáo Marketing</h1>
          <p className="mt-1 text-sm text-gray-500">
            Dữ liệu nhập tay theo ngày/sản phẩm/thị trường — chỉ để đối chiếu, không phải nguồn sự thật.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-medium text-gray-800">Báo cáo tự động Marketing</h2>
            <p className="text-sm text-gray-500">
              Doanh thu {new Date(autoFromDate).toLocaleDateString('vi-VN')}
              {autoToDate !== autoFromDate ? ` → ${new Date(autoToDate).toLocaleDateString('vi-VN')}` : ''}
              , tự động map theo Lead do từng nhân viên Marketing tạo — không cần nhập tay.
            </p>
          </div>
          <DateRangeExportBar
            idPrefix="marketing-reports-auto"
            fromDate={autoFromDate}
            toDate={autoToDate}
            onFromDateChange={setAutoFromDate}
            onToDateChange={setAutoToDate}
            onExport={handleExportAuto}
            exportDisabled={autoReports.length === 0}
          />
        </div>
        <div className="overflow-auto max-h-[72vh]">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nhân viên Marketing</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Số Lead</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Số đơn</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Doanh thu</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isAutoLoading && (
                <tr><td colSpan={4} className="px-5 py-4 text-center text-sm text-gray-500">Đang tải dữ liệu...</td></tr>
              )}
              {isAutoError && (
                <tr><td colSpan={4} className="px-5 py-4 text-center text-sm text-red-500">Lỗi khi tải báo cáo tự động</td></tr>
              )}
              {!isAutoLoading && autoReports.length === 0 && (
                <tr><td colSpan={4} className="px-5 py-8 text-center text-sm text-gray-500">Không có nhân viên Marketing nào đang hoạt động hoặc chưa có dữ liệu.</td></tr>
              )}
              {autoReports.map((report) => (
                <tr key={report.employeeId} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{report.employeeName}</td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-700 text-right">{report.leadCount}</td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-700 text-right">{report.orderCount}</td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{currency(report.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-medium text-gray-800 mb-4">Nhập báo cáo</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="report-date" className="block text-sm font-medium text-gray-700 mb-1">Ngày</label>
            <input id="report-date" required name="date" type="date" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm" />
          </div>
          <div>
            <label htmlFor="report-shift" className="block text-sm font-medium text-gray-700 mb-1">Ca</label>
            <input id="report-shift" required name="shift" type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="Sáng" />
          </div>
          <div>
            <label htmlFor="report-team" className="block text-sm font-medium text-gray-700 mb-1">Team</label>
            <input id="report-team" required name="team" type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-5 0 focus:border-blue-500 text-sm" placeholder="Team A" />
          </div>
          <div>
            <label htmlFor="report-product" className="block text-sm font-medium text-gray-700 mb-1">Sản phẩm</label>
            <input id="report-product" required name="product" type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="SGO-OAK-12MM" />
          </div>
          <div>
            <label htmlFor="report-market" className="block text-sm font-medium text-gray-700 mb-1">Thị trường</label>
            <input id="report-market" required name="market" type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="US" />
          </div>
          <div>
            <label htmlFor="report-ad-cost" className="block text-sm font-medium text-gray-700 mb-1">Chi phí Ads (VNĐ)</label>
            <input id="report-ad-cost" required name="adCost" type="number" min="0" step="1000" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm" />
          </div>
          <div>
            <label htmlFor="report-message-count" className="block text-sm font-medium text-gray-700 mb-1">Số Mess</label>
            <input id="report-message-count" required name="messageCount" type="number" min="0" step="1" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 text-sm" />
          </div>
          <div>
            <label htmlFor="report-order-count" className="block text-sm font-medium text-gray-700 mb-1">Số đơn</label>
            <input id="report-order-count" required name="orderCount" type="number" min="0" step="1" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 text-sm" />
          </div>
          <div>
            <label htmlFor="report-revenue" className="block text-sm font-medium text-gray-700 mb-1">Doanh số (VNĐ)</label>
            <input id="report-revenue" required name="revenue" type="number" min="0" step="1000" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm" />
          </div>
          <div>
            <label htmlFor="report-revenue-actual" className="block text-sm font-medium text-gray-700 mb-1">Doanh thu thực (VNĐ)</label>
            <input id="report-revenue-actual" required name="revenueActual" type="number" min="0" step="1000" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 text-sm" />
          </div>
          <div className="md:col-span-3">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              {createMutation.isPending ? 'Đang lưu...' : 'Lưu báo cáo'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-medium text-gray-800">Lịch sử báo cáo</h2>
          <DateRangeExportBar
            idPrefix="marketing-reports"
            fromDate={fromDate}
            toDate={toDate}
            onFromDateChange={setFromDate}
            onToDateChange={setToDate}
            onExport={handleExport}
            exportDisabled={filteredReports.length === 0}
          />
        </div>
        <div className="overflow-auto max-h-[72vh]">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày / Ca</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sản phẩm / Thị trường</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Chi phí Ads</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Doanh thu thực</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading && (
                <tr><td colSpan={5} className="px-5 py-4 text-center text-sm text-gray-500">Đang tải dữ liệu...</td></tr>
              )}
              {isError && (
                <tr><td colSpan={5} className="px-5 py-4 text-center text-sm text-red-500">Lỗi khi tải báo cáo</td></tr>
              )}
              {!isLoading && filteredReports.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-sm text-gray-500">Chưa có dữ liệu.</td></tr>
              )}
              {filteredReports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(report.date).toLocaleDateString('vi-VN')} · {report.shift}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500">
                    {report.team}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500">
                    {report.product} · {report.market}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(report.adCost)}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(report.revenueActual)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
