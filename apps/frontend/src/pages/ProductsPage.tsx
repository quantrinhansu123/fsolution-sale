import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';
import type {
  CreateProductInput,
  CreateProductPerformanceInput,
  Product,
  ProductPerformanceEvaluation,
  ProductUnit
} from '@fsolution/shared-types';

const PRODUCT_UNITS: ProductUnit[] = ["gói", "gói hàng tháng", "gói 3 tháng", "gói 6 tháng", "gói 12 tháng", "gói 18 tháng", "gói 24 tháng"];

const EVALUATION_LABEL: Record<ProductPerformanceEvaluation, string> = {
  win: 'Đạt (win)',
  fail: 'Không đạt (fail)',
  pending: 'Đang chờ'
};

const EVALUATION_CLASS: Record<ProductPerformanceEvaluation, string> = {
  win: 'bg-emerald-100 text-emerald-800',
  fail: 'bg-red-100 text-red-800',
  pending: 'bg-yellow-100 text-yellow-800'
};

function EditProductRow({ product, onCancel }: { product: Product; onCancel: () => void }) {
  const queryClient = useQueryClient();
  const updateMutation = useMutation({
    mutationFn: (data: { price: number; category?: string; unit?: ProductUnit }) => apiClient.updateProduct(product.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      onCancel();
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updateMutation.mutate({
      price: Number(formData.get('price')),
      category: (formData.get('category') as string) || undefined,
      unit: formData.get('unit') as ProductUnit
    });
  };

  return (
    <tr className="bg-amber-50/50">
      <td colSpan={5} className="px-5 py-3">
        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor={`edit-price-${product.id}`} className="block text-xs font-medium text-gray-700 mb-1">Giá (VNĐ)</label>
            <input
              id={`edit-price-${product.id}`}
              name="price"
              type="number"
              min="0"
              step="1000"
              defaultValue={product.price}
              className="w-36 px-2 py-1.5 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 text-sm"
            />
          </div>
          <div>
            <label htmlFor={`edit-unit-${product.id}`} className="block text-xs font-medium text-gray-700 mb-1">Đơn vị tính</label>
            <select
              id={`edit-unit-${product.id}`}
              name="unit"
              defaultValue={product.unit}
              className="px-2 py-1.5 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 text-sm cursor-pointer"
            >
              {PRODUCT_UNITS.map((unit) => (
                <option key={unit} value={unit}>{unit}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor={`edit-category-${product.id}`} className="block text-xs font-medium text-gray-700 mb-1">Danh mục</label>
            <input
              id={`edit-category-${product.id}`}
              name="category"
              type="text"
              defaultValue={product.category ?? ''}
              className="w-40 px-2 py-1.5 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 text-sm"
            />
          </div>
          <button type="submit" disabled={updateMutation.isPending} className="px-3 py-1.5 rounded-md text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 cursor-pointer disabled:opacity-50">
            {updateMutation.isPending ? 'Đang lưu...' : 'Lưu'}
          </button>
          <button type="button" onClick={onCancel} className="px-3 py-1.5 rounded-md text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 cursor-pointer">
            Huỷ
          </button>
        </form>
      </td>
    </tr>
  );
}

function PerformanceRow({ productId }: { productId: string }) {
  const queryClient = useQueryClient();

  const { data: allPerformance = [], isLoading } = useQuery({
    queryKey: ['product-performance'],
    queryFn: apiClient.getProductPerformance
  });
  const performance = allPerformance.filter((p) => p.productId === productId);

  const createMutation = useMutation({
    mutationFn: (data: CreateProductPerformanceInput) => apiClient.createProductPerformance(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['product-performance'] })
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      productId,
      stage: formData.get('stage') as string,
      evaluation: formData.get('evaluation') as ProductPerformanceEvaluation,
      messageCount: formData.get('messageCount') ? Number(formData.get('messageCount')) : undefined,
      adCost: formData.get('adCost') ? Number(formData.get('adCost')) : undefined,
      orderCount: formData.get('orderCount') ? Number(formData.get('orderCount')) : undefined,
      revenue: formData.get('revenue') ? Number(formData.get('revenue')) : undefined
    });
    e.currentTarget.reset();
  };

  return (
    <tr className="bg-gray-50/50">
      <td colSpan={5} className="px-5 py-4 space-y-3">
        {isLoading && <p className="text-sm text-gray-500">Đang tải hiệu quả test...</p>}
        {!isLoading && performance.length === 0 && <p className="text-sm text-gray-500">Chưa có dữ liệu test.</p>}
        {performance.length > 0 && (
          <ul className="space-y-1.5">
            {performance.map((p) => (
              <li key={p.id} className="text-sm flex flex-wrap items-center gap-2">
                <span className="font-medium text-gray-800">{p.stage}</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${EVALUATION_CLASS[p.evaluation]}`}>
                  {EVALUATION_LABEL[p.evaluation]}
                </span>
                {p.orderCount != null && <span className="text-gray-500">{p.orderCount} đơn</span>}
                {p.revenue != null && (
                  <span className="text-gray-500">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.revenue)}</span>
                )}
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2 pt-2 border-t border-gray-200">
          <div>
            <label htmlFor={`perf-stage-${productId}`} className="block text-xs font-medium text-gray-700 mb-1">Giai đoạn</label>
            <input id={`perf-stage-${productId}`} required name="stage" type="text" placeholder="GĐ1" className="w-24 px-2 py-1.5 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 text-sm" />
          </div>
          <div>
            <label htmlFor={`perf-evaluation-${productId}`} className="block text-xs font-medium text-gray-700 mb-1">Đánh giá</label>
            <select id={`perf-evaluation-${productId}`} name="evaluation" defaultValue="pending" className="px-2 py-1.5 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 text-sm cursor-pointer">
              <option value="pending">Đang chờ</option>
              <option value="win">Đạt (win)</option>
              <option value="fail">Không đạt (fail)</option>
            </select>
          </div>
          <div>
            <label htmlFor={`perf-order-count-${productId}`} className="block text-xs font-medium text-gray-700 mb-1">Số đơn</label>
            <input id={`perf-order-count-${productId}`} name="orderCount" type="number" min="0" className="w-20 px-2 py-1.5 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 text-sm" />
          </div>
          <div>
            <label htmlFor={`perf-revenue-${productId}`} className="block text-xs font-medium text-gray-700 mb-1">Doanh thu</label>
            <input id={`perf-revenue-${productId}`} name="revenue" type="number" min="0" step="10000" className="w-32 px-2 py-1.5 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 text-sm" />
          </div>
          <div>
            <label htmlFor={`perf-ad-cost-${productId}`} className="block text-xs font-medium text-gray-700 mb-1">Chi phí Ads</label>
            <input id={`perf-ad-cost-${productId}`} name="adCost" type="number" min="0" step="10000" className="w-32 px-2 py-1.5 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 text-sm" />
          </div>
          <div>
            <label htmlFor={`perf-message-count-${productId}`} className="block text-xs font-medium text-gray-700 mb-1">Số tin nhắn</label>
            <input id={`perf-message-count-${productId}`} name="messageCount" type="number" min="0" className="w-24 px-2 py-1.5 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 text-sm" />
          </div>
          <button type="submit" disabled={createMutation.isPending} className="px-3 py-1.5 rounded-md text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 cursor-pointer disabled:opacity-50">
            {createMutation.isPending ? 'Đang lưu...' : 'Ghi nhận test'}
          </button>
        </form>
      </td>
    </tr>
  );
}

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: products = [], isLoading, isError } = useQuery({
    queryKey: ['products'],
    queryFn: apiClient.getProducts
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateProductInput) => apiClient.createProduct(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
    onError: () => window.alert('Mã SKU đã tồn tại, vui lòng chọn mã khác.')
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newProduct: CreateProductInput = {
      name: formData.get('name') as string,
      sku: formData.get('sku') as string,
      unit: formData.get('unit') as ProductUnit,
      price: Number(formData.get('price')),
      category: (formData.get('category') as string) || undefined
    };
    createMutation.mutate(newProduct);
    e.currentTarget.reset();
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Sản phẩm</h1>
          <p className="mt-1 text-sm text-gray-500">Danh mục sản phẩm và hiệu quả test R&D theo từng giai đoạn.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 bg-white p-5 rounded-xl shadow-sm border border-gray-100 h-fit">
          <h2 className="text-lg font-medium text-gray-800 mb-4">Tạo sản phẩm</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="product-name" className="block text-sm font-medium text-gray-700 mb-1">Tên sản phẩm</label>
              <input id="product-name" required name="name" type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 text-sm" placeholder="Sàn gỗ Oak 12mm" />
            </div>
            <div>
              <label htmlFor="product-unit" className="block text-sm font-medium text-gray-700 mb-1">Đơn vị tính</label>
              <select
                id="product-unit"
                required
                name="unit"
                defaultValue=""
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 text-sm cursor-pointer"
              >
                <option value="" disabled>-- Chọn đơn vị tính --</option>
                {PRODUCT_UNITS.map((unit) => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="product-sku" className="block text-sm font-medium text-gray-700 mb-1">Mã SKU</label>
              <input id="product-sku" required name="sku" type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 text-sm" placeholder="SGO-OAK-12MM" />
            </div>
            <div>
              <label htmlFor="product-price" className="block text-sm font-medium text-gray-700 mb-1">Giá (VNĐ)</label>
              <input id="product-price" required name="price" type="number" min="0" step="1000" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 text-sm" placeholder="250000" />
            </div>
            <div>
              <label htmlFor="product-category" className="block text-sm font-medium text-gray-700 mb-1">Danh mục</label>
              <input id="product-category" name="category" type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 text-sm" placeholder="san-go" />
            </div>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              {createMutation.isPending ? 'Đang lưu...' : 'Tạo sản phẩm'}
            </button>
          </form>
        </div>

        <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-lg font-medium text-gray-800">Danh sách sản phẩm</h2>
          </div>

          <div className="overflow-auto max-h-[65vh]">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sản phẩm</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ĐVT</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Giá</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Danh mục</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading && (
                  <tr><td colSpan={5} className="px-5 py-4 text-center text-sm text-gray-500">Đang tải dữ liệu...</td></tr>
                )}
                {isError && (
                  <tr><td colSpan={5} className="px-5 py-4 text-center text-sm text-red-500">Lỗi khi tải danh sách sản phẩm</td></tr>
                )}
                {!isLoading && products.length === 0 && (
                  <tr><td colSpan={5} className="px-5 py-8 text-center text-sm text-gray-500">Chưa có dữ liệu.</td></tr>
                )}
                {products.map((product) => (
                  <React.Fragment key={product.id}>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-500">{product.sku}</div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.unit}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.category ?? '—'}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-right text-sm space-x-3">
                        <button
                          onClick={() => { setEditingId(editingId === product.id ? null : product.id); setExpandedId(null); }}
                          className="text-amber-700 hover:text-amber-800 cursor-pointer"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => { setExpandedId(expandedId === product.id ? null : product.id); setEditingId(null); }}
                          className="text-amber-700 hover:text-amber-800 cursor-pointer"
                        >
                          {expandedId === product.id ? 'Ẩn' : 'Xem hiệu quả test'}
                        </button>
                      </td>
                    </tr>
                    {editingId === product.id && (
                      <EditProductRow product={product} onCancel={() => setEditingId(null)} />
                    )}
                    {expandedId === product.id && <PerformanceRow productId={product.id} />}
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
