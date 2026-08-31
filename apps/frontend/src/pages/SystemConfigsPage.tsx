import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';

export default function SystemConfigsPage() {
  const queryClient = useQueryClient();
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [draftValue, setDraftValue] = useState('');

  const { data: configs = [], isLoading, isError } = useQuery({
    queryKey: ['system-configs'],
    queryFn: apiClient.getSystemConfigs
  });

  const updateMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) => apiClient.updateSystemConfig(key, { value }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-configs'] });
      setEditingKey(null);
    },
    onError: () => window.alert('Không thể lưu cấu hình — vui lòng thử lại.')
  });

  const startEdit = (key: string, currentValue: string) => {
    setEditingKey(key);
    setDraftValue(currentValue);
  };

  const handleSave = (key: string) => {
    updateMutation.mutate({ key, value: draftValue });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Cấu hình hệ thống</h1>
          <p className="mt-1 text-sm text-gray-500">Tỷ giá, ngưỡng cảnh báo... do Admin khai báo, dùng chung toàn hệ thống.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-lg font-medium text-gray-800">Danh sách cấu hình</h2>
        </div>

        <div className="overflow-auto max-h-[65vh]">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Key</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mô tả</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giá trị</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading && (
                <tr><td colSpan={4} className="px-5 py-4 text-center text-sm text-gray-500">Đang tải dữ liệu...</td></tr>
              )}
              {isError && (
                <tr><td colSpan={4} className="px-5 py-4 text-center text-sm text-red-500">Lỗi khi tải cấu hình hệ thống</td></tr>
              )}
              {!isLoading && configs.length === 0 && (
                <tr><td colSpan={4} className="px-5 py-8 text-center text-sm text-gray-500">Chưa có dữ liệu.</td></tr>
              )}
              {configs.map((config) => (
                <tr key={config.key} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{config.key}</td>
                  <td className="px-5 py-4 text-sm text-gray-500">{config.description ?? '—'}</td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-900">
                    {editingKey === config.key ? (
                      <input
                        aria-label={`Giá trị mới cho ${config.key}`}
                        value={draftValue}
                        onChange={(e) => setDraftValue(e.target.value)}
                        className="w-32 px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 text-sm"
                      />
                    ) : (
                      config.value
                    )}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-right text-sm space-x-3">
                    {editingKey === config.key ? (
                      <>
                        <button
                          onClick={() => handleSave(config.key)}
                          disabled={updateMutation.isPending}
                          className="text-amber-700 hover:text-amber-800 cursor-pointer disabled:opacity-50"
                        >
                          Lưu
                        </button>
                        <button onClick={() => setEditingKey(null)} className="text-gray-500 hover:text-gray-700 cursor-pointer">
                          Huỷ
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => startEdit(config.key, config.value)}
                        className="text-amber-700 hover:text-amber-800 cursor-pointer"
                      >
                        Sửa
                      </button>
                    )}
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
