import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';
import type { CampaignStatus, CreateCampaignInput } from '@fsolution/shared-types';

const STATUS_LABEL: Record<CampaignStatus, string> = {
  active: 'Đang chạy',
  paused: 'Tạm dừng',
  completed: 'Đã kết thúc'
};

const STATUS_CLASS: Record<CampaignStatus, string> = {
  active: 'bg-emerald-100 text-emerald-800',
  paused: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-gray-100 text-gray-800'
};

const CAMPAIGN_STATUSES: CampaignStatus[] = ['active', 'paused', 'completed'];

export default function CampaignsPage() {
  const queryClient = useQueryClient();

  const { data: campaigns = [], isLoading, isError } = useQuery({
    queryKey: ['campaigns'],
    queryFn: apiClient.getCampaigns
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['campaigns'] });

  const createMutation = useMutation({
    mutationFn: (data: CreateCampaignInput) => apiClient.createCampaign(data),
    onSuccess: invalidate
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: CampaignStatus }) =>
      apiClient.updateCampaign(id, { status }),
    onSuccess: invalidate
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newCampaign: CreateCampaignInput = {
      name: formData.get('name') as string,
      budget: Number(formData.get('budget')),
      market: (formData.get('market') as string) || undefined,
      product: (formData.get('product') as string) || undefined
    };
    createMutation.mutate(newCampaign);
    e.currentTarget.reset();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Chiến dịch Marketing</h1>
          <p className="mt-1 text-sm text-gray-500">Quản lý ngân sách và trạng thái từng chiến dịch.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 bg-white p-5 rounded-xl shadow-sm border border-gray-100 h-fit">
          <h2 className="text-lg font-medium text-gray-800 mb-4">Tạo chiến dịch</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="campaign-name" className="block text-sm font-medium text-gray-700 mb-1">Tên chiến dịch</label>
              <input id="campaign-name" required name="name" type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="Sàn gỗ Oak Q3" />
            </div>
            <div>
              <label htmlFor="campaign-budget" className="block text-sm font-medium text-gray-700 mb-1">Ngân sách (VNĐ)</label>
              <input id="campaign-budget" required name="budget" type="number" min="0" step="100000" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="50000000" />
            </div>
            <div>
              <label htmlFor="campaign-market" className="block text-sm font-medium text-gray-700 mb-1">Thị trường</label>
              <input id="campaign-market" name="market" type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="US" />
            </div>
            <div>
              <label htmlFor="campaign-product" className="block text-sm font-medium text-gray-700 mb-1">Sản phẩm</label>
              <input id="campaign-product" name="product" type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="SGO-OAK-12MM" />
            </div>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              {createMutation.isPending ? 'Đang lưu...' : 'Tạo chiến dịch'}
            </button>
          </form>
        </div>

        <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-lg font-medium text-gray-800">Danh sách chiến dịch</h2>
          </div>

          <div className="overflow-auto max-h-[72vh]">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chiến dịch</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ngân sách</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading && (
                  <tr><td colSpan={3} className="px-5 py-4 text-center text-sm text-gray-500">Đang tải dữ liệu...</td></tr>
                )}
                {isError && (
                  <tr><td colSpan={3} className="px-5 py-4 text-center text-sm text-red-500">Lỗi khi tải danh sách chiến dịch</td></tr>
                )}
                {!isLoading && campaigns.length === 0 && (
                  <tr><td colSpan={3} className="px-5 py-8 text-center text-sm text-gray-500">Chưa có dữ liệu.</td></tr>
                )}
                {campaigns.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{campaign.name}</div>
                      <div className="text-sm text-gray-500">{[campaign.product, campaign.market].filter(Boolean).join(' · ') || '—'}</div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(campaign.budget)}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_CLASS[campaign.status]}`}>
                          {STATUS_LABEL[campaign.status]}
                        </span>
                        <select
                          aria-label={`Đổi trạng thái chiến dịch ${campaign.name}`}
                          value={campaign.status}
                          onChange={(e) =>
                            updateStatusMutation.mutate({ id: campaign.id, status: e.target.value as CampaignStatus })
                          }
                          className="text-xs border border-gray-300 rounded-md px-1.5 py-1 bg-white focus:ring-amber-500 focus:border-amber-500 cursor-pointer"
                        >
                          {CAMPAIGN_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {STATUS_LABEL[status]}
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
