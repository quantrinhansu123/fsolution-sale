import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';
import type { CreateCustomerInput, CustomerType } from '@fsolution/shared-types';

export default function CustomersPage() {
  const queryClient = useQueryClient();

  const { data: customers = [], isLoading, isError } = useQuery({
    queryKey: ['customers'],
    queryFn: apiClient.getCustomers
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['customers'] });

  const createMutation = useMutation({
    mutationFn: (data: CreateCustomerInput) => apiClient.createCustomer(data),
    onSuccess: invalidate
  });

  const toggleTypeMutation = useMutation({
    mutationFn: ({ id, customerType }: { id: string; customerType: CustomerType }) =>
      apiClient.updateCustomer(id, { customerType }),
    onSuccess: invalidate
  });

  const toggleBlacklistMutation = useMutation({
    mutationFn: ({ id, blacklistStatus }: { id: string; blacklistStatus: boolean }) =>
      apiClient.updateCustomer(id, { blacklistStatus }),
    onSuccess: invalidate
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newCustomer: CreateCustomerInput = {
      name: formData.get('name') as string,
      phone: formData.get('phone') as string,
      address: (formData.get('address') as string) || undefined,
      city: (formData.get('city') as string) || undefined
    };
    createMutation.mutate(newCustomer);
    e.currentTarget.reset();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Khách hàng</h1>
          <p className="mt-1 text-sm text-gray-500">Hồ sơ khách hàng đã chuẩn hoá, tránh trùng lặp (SĐT duy nhất).</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 bg-white p-5 rounded-xl shadow-sm border border-gray-100 h-fit">
          <h2 className="text-lg font-medium text-gray-800 mb-4">Thêm khách hàng</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="customer-name" className="block text-sm font-medium text-gray-700 mb-1">Họ tên</label>
              <input id="customer-name" required name="name" type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="Nguyễn Văn A" />
            </div>
            <div>
              <label htmlFor="customer-phone" className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
              <input id="customer-phone" required name="phone" type="tel" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-5 text-sm" placeholder="0901234567" />
            </div>
            <div>
              <label htmlFor="customer-address" className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
              <input id="customer-address" name="address" type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="123 Láng Hạ" />
            </div>
            <div>
              <label htmlFor="customer-city" className="block text-sm font-medium text-gray-700 mb-1">Thành phố</label>
              <input id="customer-city" name="city" type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="Hà Nội" />
            </div>
            {createMutation.isError && (
              <p className="text-sm text-red-600">Không tạo được khách hàng (SĐT có thể đã tồn tại)</p>
            )}
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              {createMutation.isPending ? 'Đang lưu...' : 'Lưu thông tin'}
            </button>
          </form>
        </div>

        <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-lg font-medium text-gray-800">Danh sách khách hàng</h2>
          </div>

          <div className="overflow-auto max-h-[72vh]">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Khách hàng</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Địa chỉ</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loại KH</th>
                  <th className="px-5 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Blacklist</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading && (
                  <tr><td colSpan={4} className="px-5 py-4 text-center text-sm text-gray-500">Đang tải dữ liệu...</td></tr>
                )}
                {isError && (
                  <tr><td colSpan={4} className="px-5 py-4 text-center text-sm text-red-500">Lỗi khi tải danh sách khách hàng</td></tr>
                )}
                {!isLoading && customers.length === 0 && (
                  <tr><td colSpan={4} className="px-5 py-8 text-center text-sm text-gray-500">Chưa có dữ liệu.</td></tr>
                )}
                {customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                      <div className="text-sm text-gray-500">{customer.phone}</div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500">
                      {[customer.address, customer.city].filter(Boolean).join(', ') || '—'}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <button
                        onClick={() =>
                          toggleTypeMutation.mutate({
                            id: customer.id,
                            customerType: customer.customerType === 'new' ? 'old' : 'new'
                          })
                        }
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer ${
                          customer.customerType === 'old' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'
                        }`}
                        title="Bấm để đổi loại khách hàng"
                      >
                        {customer.customerType === 'old' ? 'Khách cũ' : 'Khách mới'}
                      </button>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-center">
                      <input
                        type="checkbox"
                        checked={customer.blacklistStatus}
                        onChange={(e) =>
                          toggleBlacklistMutation.mutate({ id: customer.id, blacklistStatus: e.target.checked })
                        }
                        className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer"
                      />
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
