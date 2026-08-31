import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';
import type { CreateFeedbackInput, FeedbackSource } from '@fsolution/shared-types';

const SOURCE_LABEL: Record<FeedbackSource, string> = {
  MKT: 'Marketing',
  Sale: 'Sale',
  CSKH: 'CSKH'
};

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="text-amber-500" aria-label={`${rating}/5 sao`}>
      {'★'.repeat(rating)}
      <span className="text-gray-300">{'★'.repeat(5 - rating)}</span>
    </span>
  );
}

export default function FeedbacksPage() {
  const queryClient = useQueryClient();

  const { data: feedbacks = [], isLoading, isError } = useQuery({
    queryKey: ['feedbacks'],
    queryFn: apiClient.getFeedbacks
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateFeedbackInput) => apiClient.createFeedback(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['feedbacks'] })
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newFeedback: CreateFeedbackInput = {
      customerId: formData.get('customerId') as string,
      orderId: (formData.get('orderId') as string) || undefined,
      source: formData.get('source') as FeedbackSource,
      content: formData.get('content') as string,
      rating: Number(formData.get('rating'))
    };
    createMutation.mutate(newFeedback);
    e.currentTarget.reset();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Phản hồi khách hàng</h1>
          <p className="mt-1 text-sm text-gray-500">Tổng hợp phản hồi từ Marketing/Sale/CSKH phục vụ R&D.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 bg-white p-5 rounded-xl shadow-sm border border-gray-100 h-fit">
          <h2 className="text-lg font-medium text-gray-800 mb-4">Ghi nhận phản hồi</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="feedback-customer-id" className="block text-sm font-medium text-gray-700 mb-1">Mã Khách hàng</label>
              <input id="feedback-customer-id" required name="customerId" type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 text-sm" placeholder="CUS-001" />
            </div>
            <div>
              <label htmlFor="feedback-order-id" className="block text-sm font-medium text-gray-700 mb-1">Mã Hợp đồng (nếu có)</label>
              <input id="feedback-order-id" name="orderId" type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 text-sm" placeholder="ORD-001" />
            </div>
            <div>
              <label htmlFor="feedback-source" className="block text-sm font-medium text-gray-700 mb-1">Nguồn</label>
              <select id="feedback-source" required name="source" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 text-sm cursor-pointer">
                <option value="MKT">Marketing</option>
                <option value="Sale">Sale</option>
                <option value="CSKH">CSKH</option>
              </select>
            </div>
            <div>
              <label htmlFor="feedback-rating" className="block text-sm font-medium text-gray-700 mb-1">Đánh giá (1-5 sao)</label>
              <input id="feedback-rating" required name="rating" type="number" min="1" max="5" defaultValue="5" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 text-sm" />
            </div>
            <div>
              <label htmlFor="feedback-content" className="block text-sm font-medium text-gray-700 mb-1">Nội dung</label>
              <textarea id="feedback-content" required name="content" rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 text-sm" placeholder="Khách hài lòng với chất lượng sàn gỗ..." />
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
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-lg font-medium text-gray-800">Danh sách phản hồi</h2>
          </div>

          <div className="overflow-auto max-h-[72vh]">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Khách hàng</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nguồn</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nội dung</th>
                  <th className="px-5 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Đánh giá</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading && (
                  <tr><td colSpan={4} className="px-5 py-4 text-center text-sm text-gray-500">Đang tải dữ liệu...</td></tr>
                )}
                {isError && (
                  <tr><td colSpan={4} className="px-5 py-4 text-center text-sm text-red-500">Lỗi khi tải danh sách phản hồi</td></tr>
                )}
                {!isLoading && feedbacks.length === 0 && (
                  <tr><td colSpan={4} className="px-5 py-8 text-center text-sm text-gray-500">Chưa có dữ liệu.</td></tr>
                )}
                {feedbacks.map((feedback) => (
                  <tr key={feedback.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {feedback.customerId}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {SOURCE_LABEL[feedback.source]}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500 max-w-xs truncate">{feedback.content}</td>
                    <td className="px-5 py-4 whitespace-nowrap text-center text-sm">
                      <StarRating rating={feedback.rating} />
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
