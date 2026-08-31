import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';
import type { CreateLeadInput, LeadStatus } from '@fsolution/shared-types';
import { LeadStatusBadge } from '../components/StatusBadge';
import { DateRangeExportBar } from '../components/DateRangeExportBar';
import { useDateRangeFilter } from '../hooks/useDateRangeFilter';
import { exportRowsToExcel } from '../utils/excelExport';
import { useAuthStore } from '../store/useAuthStore';

const LEAD_STATUSES: LeadStatus[] = ['new', 'contacted', 'qualified', 'converted', 'lost'];

function LeadLogsRow({ leadId }: { leadId: string }) {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['leads', leadId, 'logs'],
    queryFn: () => apiClient.getLeadLogs(leadId)
  });

  return (
    <tr className="bg-gray-50/50">
      <td colSpan={10} className="px-5 py-3">
        {isLoading && <p className="text-sm text-gray-500">Đang tải lịch sử...</p>}
        {!isLoading && logs.length === 0 && <p className="text-sm text-gray-500">Chưa có lịch sử thay đổi.</p>}
        {logs.length > 0 && (
          <ul className="space-y-1">
            {logs.map((log) => (
              <li key={log.id} className="text-sm text-gray-600">
                <span className="font-medium text-gray-800">
                  {log.fieldChanged === 'assignedTo'
                    ? `Đổi Sale phụ trách: ${log.oldValue ?? '(chưa có)'} → ${log.newValue}`
                    : `${log.fromStatus ?? '—'} → ${log.toStatus}`}
                </span>
                {log.note && <span className="text-gray-500"> — {log.note}</span>}
                <span className="text-gray-400"> ({new Date(log.createdAt).toLocaleString('vi-VN')})</span>
              </li>
            ))}
          </ul>
        )}
      </td>
    </tr>
  );
}

export default function LeadsPage() {
  const queryClient = useQueryClient();
  const [expandedLeadId, setExpandedLeadId] = useState<string | null>(null);

  const { data: leads = [], isLoading, isError } = useQuery({
    queryKey: ['leads'],
    queryFn: () => apiClient.getLeads()
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: apiClient.getEmployees
  });

  const currentAccount = useAuthStore((s) => s.account);
  const myEmployee = employees.find((e) => e.accountId === currentAccount?.id);
  const mktEmployees = employees.filter((e) => e.role === 'MKT');
  const employeeNameById = (id?: string | null) => employees.find((e) => e.id === id)?.name;

  const [sourcedBy, setSourcedBy] = useState('');

  // Mới — nếu tài khoản đang đăng nhập là 1 nhân viên Marketing, mặc định điền chính họ vào ô
  // "Chọn nhân viên Marketing" (chỉ tự set 1 lần khi rỗng, không ghi đè lựa chọn tay của người dùng).
  useEffect(() => {
    if (myEmployee?.role === 'MKT' && !sourcedBy) {
      setSourcedBy(myEmployee.id);
    }
  }, [myEmployee, sourcedBy]);

  const { fromDate, setFromDate, toDate, setToDate, filtered: filteredLeads } = useDateRangeFilter(
    leads,
    (lead) => lead.createdAt
  );

  function handleExport() {
    const rows = filteredLeads.map((lead) => ({
      'Mã Lead': lead.code ?? '',
      'Tên khách hàng': lead.name,
      'Số điện thoại': lead.phone,
      'Nguồn': lead.source,
      'Sản phẩm quan tâm': lead.productInterest ?? '',
      'Mã hội thoại': lead.threadId ?? '',
      'Trạng thái': lead.status,
      'Sale phụ trách': employeeNameById(lead.assignedTo) ?? '',
      'Nhân viên Marketing': employeeNameById(lead.sourcedBy) ?? '',
      'Ngày tạo': new Date(lead.createdAt).toLocaleDateString('vi-VN')
    }));
    exportRowsToExcel(rows, 'leads', 'Leads');
  }

  const assignMutation = useMutation({
    mutationFn: ({ id, assignedTo }: { id: string; assignedTo: string }) =>
      apiClient.updateLead(id, { assignedTo: assignedTo || null }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leads'] })
  });

  const mutation = useMutation({
    mutationFn: (newLead: CreateLeadInput) => apiClient.createLead(newLead),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: LeadStatus }) =>
      apiClient.updateLead(id, { status }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['leads', id, 'logs'] });
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const productInterest = formData.get('productInterest') as string;
    const threadId = formData.get('threadId') as string;
    const newLead: CreateLeadInput = {
      name: formData.get('name') as string,
      phone: formData.get('phone') as string,
      source: formData.get('source') as string,
      ...(productInterest ? { productInterest } : {}),
      ...(threadId ? { threadId } : {}),
      ...(sourcedBy ? { sourcedBy } : {}),
    };
    mutation.mutate(newLead);
    e.currentTarget.reset();
    setSourcedBy(myEmployee?.role === 'MKT' ? myEmployee.id : '');
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Khách hàng tiềm năng</h1>
          <p className="mt-1 text-sm text-gray-500">Quản lý và theo dõi danh sách khách hàng từ các chiến dịch MKT.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-5 items-start">
        {/* Form thêm mới */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 h-fit shrink-0">
          <h2 className="text-lg font-medium text-gray-800 mb-4">Thêm Lead mới</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="lead-name" className="block text-sm font-medium text-gray-700 mb-1">Họ tên</label>
              <input id="lead-name" required name="name" type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="Nguyễn Văn A" />
            </div>
            <div>
              <label htmlFor="lead-phone" className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
              <input id="lead-phone" required name="phone" type="tel" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="0901234567" />
            </div>
            <div>
              <label htmlFor="lead-source" className="block text-sm font-medium text-gray-700 mb-1">Nguồn</label>
              <select id="lead-source" required name="source" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm bg-white">
                <option value="Facebook Ads">Facebook Ads</option>
                <option value="Google Search">Google Search</option>
                <option value="Zalo OA">Zalo OA</option>
                <option value="Website Form">Website Form</option>
                <option value="Giới thiệu khách cũ">Giới thiệu khách cũ</option>
              </select>
            </div>
            <div>
              <label htmlFor="lead-sourced-by" className="block text-sm font-medium text-gray-700 mb-1">Nhân viên Marketing</label>
              <select
                id="lead-sourced-by"
                value={sourcedBy}
                onChange={(e) => setSourcedBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm bg-white cursor-pointer"
              >
                <option value="">-- Chưa gán --</option>
                {mktEmployees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="lead-product-interest" className="block text-sm font-medium text-gray-700 mb-1">Sản phẩm quan tâm</label>
              <input id="lead-product-interest" name="productInterest" type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="Sàn gỗ Oak 12mm" />
            </div>
            <div>
              <label htmlFor="lead-thread-id" className="block text-sm font-medium text-gray-700 mb-1">Thread ID (Pancake/Zalo)</label>
              <input id="lead-thread-id" name="threadId" type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="pancake-thread-123" />
            </div>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              {mutation.isPending ? 'Đang lưu...' : 'Lưu thông tin'}
            </button>
          </form>
        </div>

        {/* Danh sách */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col min-w-0">
          <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50/50 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-gray-800">Danh sách Leads</h2>
            <DateRangeExportBar
              idPrefix="leads"
              fromDate={fromDate}
              toDate={toDate}
              onFromDateChange={setFromDate}
              onToDateChange={setToDate}
              onExport={handleExport}
              exportDisabled={filteredLeads.length === 0}
            />
          </div>

          <div className="overflow-auto max-h-[72vh]">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã Lead</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Khách hàng</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nguồn</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sản phẩm quan tâm</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã hội thoại</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sale phụ trách</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NV Marketing</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày tạo</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Lịch sử</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading && (
                  <tr><td colSpan={10} className="px-5 py-4 text-center text-sm text-gray-500">Đang tải dữ liệu...</td></tr>
                )}
                {isError && (
                  <tr><td colSpan={10} className="px-5 py-4 text-center text-sm text-red-500">Lỗi khi tải danh sách leads</td></tr>
                )}
                {!isLoading && filteredLeads.length === 0 && (
                  <tr><td colSpan={10} className="px-5 py-8 text-center text-sm text-gray-500">Chưa có dữ liệu.</td></tr>
                )}
                {filteredLeads.map((lead) => (
                  <React.Fragment key={lead.id}>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3.5 whitespace-nowrap text-sm font-mono text-gray-700">
                        {lead.code ?? '—'}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{lead.name}</div>
                        <div className="text-xs text-gray-500">{lead.phone}</div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-500">
                        {lead.source}
                      </td>
                      <td className="px-4 py-3.5 max-w-[140px] text-sm text-gray-500 break-words">
                        {lead.productInterest ?? '—'}
                      </td>
                      <td className="px-4 py-3.5 max-w-[140px] text-sm text-gray-500 break-words">
                        {lead.threadId ?? '—'}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <LeadStatusBadge status={lead.status} />
                          <select
                            aria-label={`Đổi trạng thái lead ${lead.name}`}
                            value={lead.status}
                            onChange={(e) =>
                              updateStatusMutation.mutate({ id: lead.id, status: e.target.value as LeadStatus })
                            }
                            className="text-xs border border-gray-300 rounded-md px-1.5 py-1 bg-white focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                          >
                            {LEAD_STATUSES.map((status) => (
                              <option key={status} value={status}>{status}</option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <select
                          aria-label={`Phân bổ Sale cho lead ${lead.name}`}
                          value={lead.assignedTo ?? ''}
                          onChange={(e) => assignMutation.mutate({ id: lead.id, assignedTo: e.target.value })}
                          className="text-xs border border-gray-300 rounded-md px-1.5 py-1 bg-white focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                        >
                          <option value="">-- Chưa phân bổ --</option>
                          {employees.map((employee) => (
                            <option key={employee.id} value={employee.id}>{employee.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-500">
                        {employeeNameById(lead.sourcedBy) ?? '—'}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-500">
                        {new Date(lead.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-right text-sm">
                        <button
                          onClick={() => setExpandedLeadId(expandedLeadId === lead.id ? null : lead.id)}
                          className="text-blue-600 hover:text-blue-800 cursor-pointer"
                        >
                          {expandedLeadId === lead.id ? 'Ẩn' : 'Xem lịch sử'}
                        </button>
                      </td>
                    </tr>
                    {expandedLeadId === lead.id && <LeadLogsRow leadId={lead.id} />}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
