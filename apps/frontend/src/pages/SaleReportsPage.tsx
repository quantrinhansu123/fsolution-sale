import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';
import { DateRangeExportBar } from '../components/DateRangeExportBar';
import { exportRowsToExcel } from '../utils/excelExport';
import { today } from '../utils/date';

const currency = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

export default function SaleReportsPage() {
  const [fromDate, setFromDate] = useState(today());
  const [toDate, setToDate] = useState(today());

  // Mới (Phase 3) — báo cáo tự động tính real-time từ Leads/Hợp đồng/Khách hàng, không nhập tay nữa.
  // Mới — cho phép gộp số liệu theo khoảng [fromDate, toDate] thay vì chỉ 1 ngày.
  const { data: reports = [], isLoading, isError } = useQuery({
    queryKey: ['sale-reports-auto', fromDate, toDate],
    queryFn: () => apiClient.getSaleReportsAuto(fromDate, toDate)
  });

  function handleExport() {
    const rows = reports.map((report) => ({
      'Nhân viên Sale': report.employeeName,
      'Leads mới': report.newLeadsAssigned,
      'Đã liên hệ': report.leadsToContacted,
      'Tiềm năng': report.leadsToQualified,
      'Đã chốt': report.leadsToConverted,
      'Đã mất': report.leadsToLost,
      'Số đơn': report.orderCount,
      'SL sản phẩm': report.productsSold,
      'Doanh số': report.revenueTotal,
      'DS đã xác nhận': report.revenueConfirmed,
      'Khách mới': report.newCustomers,
      'Khách mua lại': report.returningCustomers
    }));
    exportRowsToExcel(rows, 'bao-cao-sale', 'Báo cáo Sale');
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Báo cáo Sale</h1>
          <p className="mt-1 text-sm text-gray-500">
            Tự động tổng hợp từ Danh sách Leads, Hợp đồng và Khách hàng theo khoảng ngày — không cần nhập tay.
          </p>
        </div>
        <DateRangeExportBar
          idPrefix="sale-reports"
          fromDate={fromDate}
          toDate={toDate}
          onFromDateChange={setFromDate}
          onToDateChange={setToDate}
          onExport={handleExport}
          exportDisabled={reports.length === 0}
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-lg font-medium text-gray-800">
            Báo cáo theo Sale — {new Date(fromDate).toLocaleDateString('vi-VN')}
            {toDate !== fromDate ? ` → ${new Date(toDate).toLocaleDateString('vi-VN')}` : ''}
          </h2>
        </div>
        <div className="overflow-auto max-h-[65vh]">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nhân viên Sale</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Leads mới</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Đã liên hệ</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Tiềm năng</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Đã chốt</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Đã mất</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Số đơn</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">SL sản phẩm</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Doanh số</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">DS đã xác nhận</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Khách mới</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Khách mua lại</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading && (
                <tr><td colSpan={12} className="px-5 py-4 text-center text-sm text-gray-500">Đang tải dữ liệu...</td></tr>
              )}
              {isError && (
                <tr><td colSpan={12} className="px-5 py-4 text-center text-sm text-red-500">Lỗi khi tải báo cáo</td></tr>
              )}
              {!isLoading && reports.length === 0 && (
                <tr><td colSpan={12} className="px-5 py-8 text-center text-sm text-gray-500">Không có Sale nào đang hoạt động hoặc chưa có dữ liệu ngày này.</td></tr>
              )}
              {reports.map((report) => (
                <tr key={report.employeeId} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{report.employeeName}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 text-right">{report.newLeadsAssigned}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 text-right">{report.leadsToContacted}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 text-right">{report.leadsToQualified}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 text-right">{report.leadsToConverted}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 text-right">{report.leadsToLost}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 text-right">{report.orderCount}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 text-right">{report.productsSold}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{currency(report.revenueTotal)}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{currency(report.revenueConfirmed)}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 text-right">{report.newCustomers}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 text-right">{report.returningCustomers}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
