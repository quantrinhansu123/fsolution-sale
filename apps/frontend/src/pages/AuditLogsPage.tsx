import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';
import { DateRangeExportBar } from '../components/DateRangeExportBar';
import { useDateRangeFilter } from '../hooks/useDateRangeFilter';
import { exportRowsToExcel } from '../utils/excelExport';

export default function AuditLogsPage() {
  const { data: logs = [], isLoading, isError } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: apiClient.getAuditLogs
  });

  const { fromDate, setFromDate, toDate, setToDate, filtered: filteredLogs } = useDateRangeFilter(
    logs,
    (log) => log.createdAt
  );

  function handleExport() {
    const rows = filteredLogs.map((log) => ({
      'Bảng': log.tableName,
      'Mã bản ghi': log.recordId,
      'Trường thay đổi': log.fieldChanged ?? '',
      'Giá trị cũ': log.oldValue ?? '',
      'Giá trị mới': log.newValue ?? '',
      'Người sửa': log.changedBy ?? '',
      'Thời điểm': new Date(log.createdAt).toLocaleString('vi-VN')
    }));
    exportRowsToExcel(rows, 'lich-su-thay-doi', 'Nhật ký hệ thống');
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Nhật ký hệ thống</h1>
          <p className="mt-1 text-sm text-gray-500">Truy vết ai sửa / sửa gì / khi nào — chỉ admin xem được.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-medium text-gray-800">Lịch sử thay đổi</h2>
          <DateRangeExportBar
            idPrefix="audit-logs"
            fromDate={fromDate}
            toDate={toDate}
            onFromDateChange={setFromDate}
            onToDateChange={setToDate}
            onExport={handleExport}
            exportDisabled={filteredLogs.length === 0}
          />
        </div>

        <div className="overflow-auto max-h-[72vh]">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bảng</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thay đổi</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Người sửa</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thời điểm</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading && (
                <tr><td colSpan={4} className="px-5 py-4 text-center text-sm text-gray-500">Đang tải dữ liệu...</td></tr>
              )}
              {isError && (
                <tr><td colSpan={4} className="px-5 py-4 text-center text-sm text-red-500">Lỗi khi tải nhật ký hệ thống (chỉ admin xem được)</td></tr>
              )}
              {!isLoading && filteredLogs.length === 0 && (
                <tr><td colSpan={4} className="px-5 py-8 text-center text-sm text-gray-500">Chưa có dữ liệu.</td></tr>
              )}
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{log.tableName}</div>
                    <div className="text-xs text-gray-500 font-mono">{log.recordId}</div>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-600">
                    {log.fieldChanged ? (
                      <span>
                        <span className="font-medium">{log.fieldChanged}</span>: {log.oldValue ?? '—'} → {log.newValue ?? '—'}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                    {log.changedBy ?? '—'}
                  </td>
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
  );
}
