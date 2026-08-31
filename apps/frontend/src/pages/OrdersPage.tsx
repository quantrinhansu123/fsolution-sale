import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';
import type { CreateOrderInput, CreateOrderItemInput, Order, OrderStatus } from '@fsolution/shared-types';
import { OrderStatusBadge } from '../components/StatusBadge';
import { DateRangeExportBar } from '../components/DateRangeExportBar';
import { useDateRangeFilter } from '../hooks/useDateRangeFilter';
import { exportRowsToExcel } from '../utils/excelExport';

type OrderItemDraft = {
  productId: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
};

const EMPTY_ITEM: OrderItemDraft = { productId: '', quantity: 1, unitPrice: 0, discountPercent: 0 };

const ORDER_STATUSES: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
const LOCKED_STATUSES: OrderStatus[] = ['delivered', 'cancelled'];

const currency = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

function OrderItemsRow({ orderId }: { orderId: string }) {
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['orders', orderId, 'items'],
    queryFn: () => apiClient.getOrderItems(orderId)
  });

  return (
    <tr className="bg-gray-50/50">
      <td colSpan={14} className="px-5 py-3">
        {isLoading && <p className="text-sm text-gray-500">Đang tải sản phẩm...</p>}
        {!isLoading && items.length === 0 && <p className="text-sm text-gray-500">Chưa có sản phẩm nào trong đơn.</p>}
        {items.length > 0 && (
          <ul className="space-y-1">
            {items.map((item) => (
              <li key={item.id} className="text-sm text-gray-600 flex justify-between max-w-md">
                <span>
                  {item.productName} × {item.quantity}{item.unit ? ` ${item.unit}` : ''}
                  {item.isGift && <span className="ml-1 text-emerald-600">(quà tặng)</span>}
                </span>
                <span className="text-gray-500">
                  {currency(item.unitPrice)}
                  {item.discountPercent ? ` (-${item.discountPercent}%)` : ''}
                </span>
              </li>
            ))}
          </ul>
        )}
      </td>
    </tr>
  );
}

export default function OrdersPage() {
  const queryClient = useQueryClient();
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [items, setItems] = useState<OrderItemDraft[]>([{ ...EMPTY_ITEM }]);
const [selectedLeadId, setSelectedLeadId] = useState<string>('');
const [customerName, setCustomerName] = useState<string>('');
const [shippingPhone, setShippingPhone] = useState<string>('');

  const { data: orders = [], isLoading, isError } = useQuery({
    queryKey: ['orders'],
    queryFn: () => apiClient.getOrders()
  });

  // Mới (Phase 3) — dropdown "Chọn mã Lead" chỉ hiện Lead đã "Đã chốt" của chính Sale đang đăng nhập
  const { data: convertedLeads = [] } = useQuery({
    queryKey: ['leads', 'converted', 'me'],
    queryFn: () => apiClient.getLeads({ status: 'converted', assignedTo: 'me' })
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: apiClient.getProducts
  });

  const findProduct = (productId: string) => products.find((p) => p.id === productId);

  const { fromDate, setFromDate, toDate, setToDate, filtered: filteredOrders } = useDateRangeFilter(
    orders,
    (order) => order.createdAt
  );

  const totalAmount = useMemo(
    () =>
      Math.round(
        items.reduce((sum, item) => sum + item.quantity * item.unitPrice * (1 - item.discountPercent / 100), 0)
      ),
    [items]
  );

  function updateItem(index: number, patch: Partial<OrderItemDraft>) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function handleProductChange(index: number, productId: string) {
    const product = findProduct(productId);
    updateItem(index, { productId, unitPrice: product?.price ?? 0 });
  }

  function addItemRow() {
    setItems((prev) => [...prev, { ...EMPTY_ITEM }]);
  }

  function removeItemRow(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  const mutation = useMutation({
    mutationFn: async ({ order, extraItems }: { order: CreateOrderInput; extraItems: CreateOrderItemInput[] }) => {
      const created = await apiClient.createOrder(order);
      for (const item of extraItems) {
        await apiClient.addOrderItem(created.id, item);
      }
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      apiClient.updateOrder(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] })
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const leadId = formData.get('leadId') as string;

    const [firstItem, ...restItems] = items;
    const firstProduct = findProduct(firstItem.productId);

    const newOrder: CreateOrderInput = {
      ...(leadId ? { leadId } : {}),
      customerName: formData.get('customerName') as string,
      shippingAddress: formData.get('shippingAddress') as string,
      shippingPhone: formData.get('shippingPhone') as string,
      ...((formData.get('note') as string) ? { note: formData.get('note') as string } : {}),
      productId: firstItem.productId,
      productName: firstProduct?.name ?? '',
      unit: firstProduct?.unit,
      quantity: firstItem.quantity,
      unitPrice: firstItem.unitPrice,
      discountPercent: firstItem.discountPercent,
      totalAmount,
    };

    const extraItems: CreateOrderItemInput[] = restItems.map((item) => {
      const product = findProduct(item.productId);
      return {
        productId: item.productId,
        productName: product?.name ?? '',
        unit: product?.unit,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountPercent: item.discountPercent,
      };
    });

    mutation.mutate({ order: newOrder, extraItems });
    e.currentTarget.reset();
    setItems([{ ...EMPTY_ITEM }]);
    setSelectedLeadId('');
    setCustomerName('');
    setShippingPhone('');
  };

  function handleExportExcel() {
    const rows = filteredOrders.map((order: Order) => {
      const firstItem = order.items?.[0];
      return {
        'Khách hàng': order.customerName ?? order.customerId,
        'Mã Lead': order.leadCode ?? '',
        'Sale phụ trách': order.assignedToName ?? '',
        'Sản phẩm': firstItem?.productName ?? '',
        'SL': firstItem?.quantity ?? '',
        'Giá bán': firstItem?.unitPrice ?? '',
        '%KM': firstItem?.discountPercent ?? '',
        'Thành tiền': order.totalAmount,
        'Địa chỉ': order.shippingAddress ?? '',
        'SĐT': order.shippingPhone ?? '',
        'Ghi chú': order.note ?? '',
        'Trạng thái': order.status,
        'Ngày tạo': new Date(order.createdAt).toLocaleDateString('vi-VN')
      };
    });
    exportRowsToExcel(rows, 'don-hang', 'Hợp đồng');
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Quản lý Hợp đồng</h1>
          <p className="mt-1 text-sm text-gray-500">Theo dõi trạng thái và doanh thu các hợp đồng sàn gỗ.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Form thêm mới */}
        <div className="md:col-span-1 bg-white p-5 rounded-xl shadow-sm border border-gray-100 h-fit">
          <h2 className="text-lg font-medium text-gray-800 mb-4">Tạo Hợp đồng</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="order-lead-id" className="block text-sm font-medium text-gray-700 mb-1">Chọn mã Lead</label>
              <select
                  id="order-lead-id"
                  name="leadId"
                  value={selectedLeadId}
                  onChange={(e) => {
                    const leadId = e.target.value;
                    setSelectedLeadId(leadId);
                    const lead = convertedLeads.find((l) => l.id === leadId);
                    if (lead) {
                      setCustomerName(lead.name);
                      setShippingPhone(lead.phone);
                    } else {
                      setCustomerName('');
                      setShippingPhone('');
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 text-sm cursor-pointer"
                >
                  <option value="">-- Không gắn Lead --</option>
                  {convertedLeads.map((lead) => (
                    <option key={lead.id} value={lead.id}>
                      {lead.code ?? lead.id.slice(0, 8)} — {lead.name}
                    </option>
                  ))}
                </select>
            </div>
            <div>
              <label htmlFor="order-customer-name" className="block text-sm font-medium text-gray-700 mb-1">Tên khách hàng</label>
              <input id="order-customer-name" required name="customerName" type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 text-sm" placeholder="Nguyễn Văn A" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
            </div>
            {items.map((item, idx) => {
              const product = findProduct(item.productId);
              return (
                <div key={idx} className="space-y-3 bg-gray-50/70 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Sản phẩm {idx + 1}</span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItemRow(idx)}
                        className="text-xs text-red-600 hover:text-red-800 cursor-pointer"
                      >
                        Xoá
                      </button>
                    )}
                  </div>
                  <div>
                    <label htmlFor={`order-product-id-${idx}`} className="block text-sm font-medium text-gray-700 mb-1">Chọn sản phẩm</label>
                    <select
                      id={`order-product-id-${idx}`}
                      required
                      value={item.productId}
                      onChange={(e) => handleProductChange(idx, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white focus:ring-amber-500 focus:border-amber-500 text-sm cursor-pointer"
                    >
                      <option value="">-- Chọn sản phẩm --</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} — {p.sku}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      Đơn vị tính: <span className="font-medium text-gray-700">{product?.unit ?? '—'}</span>
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor={`order-quantity-${idx}`} className="block text-sm font-medium text-gray-700 mb-1">Số lượng</label>
                      <input
                        id={`order-quantity-${idx}`}
                        required
                        type="number"
                        min="1"
                        step="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(idx, { quantity: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor={`order-unit-price-${idx}`} className="block text-sm font-medium text-gray-700 mb-1">Giá bán</label>
                      <input
                        id={`order-unit-price-${idx}`}
                        required
                        type="number"
                        min="0"
                        step="1000"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(idx, { unitPrice: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor={`order-discount-${idx}`} className="block text-sm font-medium text-gray-700 mb-1">% Khuyến mại</label>
                    <input
                      id={`order-discount-${idx}`}
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={item.discountPercent}
                      onChange={(e) => updateItem(idx, { discountPercent: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 text-sm"
                    />
                  </div>
                </div>
              );
            })}
            <div className="rounded-md bg-gray-50 border border-gray-200 px-3 py-2">
              <span className="text-xs font-medium text-gray-500 uppercase">Thành tiền</span>
              <div className="text-lg font-semibold text-gray-900">{currency(totalAmount)}</div>
            </div>
            <button
              type="button"
              onClick={addItemRow}
              className="w-full py-2 px-4 border border-dashed border-amber-400 rounded-md text-sm font-medium text-amber-700 hover:bg-amber-50 cursor-pointer"
            >
              + Thêm sản phẩm
            </button>
            <div>
              <label htmlFor="order-shipping-address" className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ nhận hàng</label>
              <input id="order-shipping-address" required name="shippingAddress" type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 text-sm" placeholder="12 Láng Hạ, Hà Nội" />
            </div>
            <div>
              <label htmlFor="order-shipping-phone" className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại nhận hàng</label>
              <input id="order-shipping-phone" required name="shippingPhone" type="tel" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 text-sm" placeholder="0901234567" value={shippingPhone} onChange={(e) => setShippingPhone(e.target.value)} />
            </div>
            <div>
              <label htmlFor="order-note" className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
              <textarea id="order-note" name="note" rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 text-sm" placeholder="Giao trong giờ hành chính" />
            </div>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              {mutation.isPending ? 'Đang tạo...' : 'Tạo đơn'}
            </button>
          </form>
        </div>

        {/* Danh sách */}
        <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-medium text-gray-800">Danh sách Hợp đồng</h2>
            <DateRangeExportBar
              idPrefix="orders"
              fromDate={fromDate}
              toDate={toDate}
              onFromDateChange={setFromDate}
              onToDateChange={setToDate}
              onExport={handleExportExcel}
              exportDisabled={filteredOrders.length === 0}
            />
          </div>

          <div className="overflow-auto max-h-[65vh]">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Khách hàng</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã Lead</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sale phụ trách</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sản phẩm</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">SL</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Giá bán</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">%KM</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thành tiền</th>
                  <th className="px-5 py-3 min-w-[200px] text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Địa chỉ</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SĐT</th>
                  <th className="px-5 py-3 min-w-[200px] text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ghi chú</th>
                  <th className="px-5 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày tạo</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Xem</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading && (
                  <tr><td colSpan={14} className="px-5 py-4 text-center text-sm text-gray-500">Đang tải dữ liệu...</td></tr>
                )}
                {isError && (
                  <tr><td colSpan={14} className="px-5 py-4 text-center text-sm text-red-500">Lỗi khi tải danh sách hợp đồng</td></tr>
                )}
                {!isLoading && filteredOrders.length === 0 && (
                  <tr><td colSpan={14} className="px-5 py-8 text-center text-sm text-gray-500">Chưa có dữ liệu.</td></tr>
                )}
                {filteredOrders.map((order) => {
                  const locked = LOCKED_STATUSES.includes(order.status);
                  const firstItem = order.items?.[0];
                  return (
                    <React.Fragment key={order.id}>
                      <tr className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {order.customerName ?? order.customerId}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-700">
                          {order.leadCode ?? '—'}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-700">
                          {order.assignedToName ?? '—'}
                        </td>
                        <td className="px-5 py-4 max-w-[160px] text-sm text-gray-700 break-words">
                          {firstItem?.productName ?? '—'}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-700 text-right">
                          {firstItem?.quantity ?? '—'}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-700 text-right">
                          {firstItem ? currency(firstItem.unitPrice) : '—'}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-700 text-right">
                          {firstItem?.discountPercent ? `${firstItem.discountPercent}%` : '—'}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                          {currency(order.totalAmount)}
                        </td>
                        <td className="px-5 py-4 max-w-[320px] text-sm text-gray-500 break-words">
                          {order.shippingAddress ?? '—'}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.shippingPhone ?? '—'}
                        </td>
                        <td className="px-5 py-4 max-w-[320px] text-sm text-gray-500 break-words">
                          {order.note ?? '—'}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2">
                            <OrderStatusBadge status={order.status} />
                            <select
                              aria-label={`Đổi trạng thái đơn ${order.customerId}`}
                              value={order.status}
                              disabled={locked}
                              onChange={(e) =>
                                updateStatusMutation.mutate({ id: order.id, status: e.target.value as OrderStatus })
                              }
                              className="text-xs border border-gray-300 rounded-md px-1.5 py-1 bg-white focus:ring-amber-500 focus:border-amber-500 cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400"
                              title={locked ? 'Đơn đã khoá, không thể sửa' : undefined}
                            >
                              {ORDER_STATUSES.map((status) => (
                                <option key={status} value={status}>
                                  {status}
                                </option>
                              ))}
                            </select>
                          </div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-right text-sm">
                          <button
                            onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                            className="text-amber-700 hover:text-amber-800 cursor-pointer"
                          >
                            {expandedOrderId === order.id ? 'Ẩn' : 'Xem'}
                          </button>
                        </td>
                      </tr>
                      {expandedOrderId === order.id && <OrderItemsRow orderId={order.id} />}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
