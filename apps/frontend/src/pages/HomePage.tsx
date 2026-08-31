import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { apiClient } from "../services/apiClient";
import { useAuthStore } from "../store/useAuthStore";
import type { DashboardPeriodType } from "@fsolution/shared-types";
import { TrendLineChart } from "../components/charts/TrendLineChart";
import { StackedBarChart, type StackSegment } from "../components/charts/StackedBarChart";

const PERIOD_LABEL: Record<DashboardPeriodType, string> = {
  day: "Ngày",
  week: "Tuần",
  month: "Tháng"
};

const LEAD_SEGMENTS: StackSegment[] = [
  { key: "new", label: "Mới" },
  { key: "contacted", label: "Đã liên hệ" },
  { key: "qualified", label: "Tiềm năng" },
  { key: "converted", label: "Đã chốt" },
  { key: "lost", label: "Đã mất" }
];

const ORDER_SEGMENTS: StackSegment[] = [
  { key: "pending", label: "Chờ xử lý" },
  { key: "confirmed", label: "Đã xác nhận" },
  { key: "shipped", label: "Đang giao" },
  { key: "delivered", label: "Đã giao" },
  { key: "cancelled", label: "Đã huỷ" }
];

const CSKH_SEGMENTS: StackSegment[] = [
  { key: "called", label: "Đã gọi" },
  { key: "upsell", label: "Upsell" },
  { key: "cross_sell", label: "Cross-sell" },
  { key: "no_answer", label: "Không nghe máy" }
];

const currency = (n: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n);

function DashboardCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
      <h2 className="text-lg font-medium text-gray-800 mb-4">{title}</h2>
      {children}
    </div>
  );
}

function AdminDashboard() {
  const [period, setPeriod] = useState<DashboardPeriodType>("month");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["dashboard-overview", period],
    queryFn: () => apiClient.getDashboardOverview(period)
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard Tổng Quan</h1>
          <p className="mt-1 text-sm text-gray-500">Biến động 5 kỳ gần nhất — chỉ admin xem được.</p>
        </div>
        <div className="flex bg-gray-100 rounded-md p-1 self-start sm:self-auto">
          {(Object.keys(PERIOD_LABEL) as DashboardPeriodType[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md cursor-pointer transition-colors ${
                period === p ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {PERIOD_LABEL[p]}
            </button>
          ))}
        </div>
      </div>

      {isLoading && <p className="text-sm text-gray-500">Đang tải dữ liệu Dashboard...</p>}
      {isError && <p className="text-sm text-red-500">Không tải được dữ liệu Dashboard.</p>}

      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DashboardCard title="Doanh thu · Chi phí · Lợi nhuận">
            <TrendLineChart
              periods={data.periods}
              formatValue={currency}
              series={[
                { name: "Doanh thu", values: data.revenueCostProfit.map((r) => r.revenue) },
                { name: "Chi phí", values: data.revenueCostProfit.map((r) => r.cost) },
                { name: "Lợi nhuận", values: data.revenueCostProfit.map((r) => r.profit) }
              ]}
            />
          </DashboardCard>

          <DashboardCard title="Thu · Chi">
            <TrendLineChart
              periods={data.periods}
              formatValue={currency}
              series={[
                { name: "Thu", values: data.cashFlow.map((c) => c.income) },
                { name: "Chi", values: data.cashFlow.map((c) => c.expense) }
              ]}
            />
          </DashboardCard>

          <DashboardCard title="Doanh thu theo nhân viên Sale">
            <TrendLineChart
              periods={data.periods}
              formatValue={currency}
              series={data.salesRevenue.map((s) => ({ name: s.employeeName, values: s.values }))}
            />
          </DashboardCard>

          <DashboardCard title="Doanh thu Marketing (gắn với Lead)">
            <TrendLineChart
              periods={data.periods}
              formatValue={currency}
              series={data.marketingRevenue.map((s) => ({ name: s.employeeName, values: s.values }))}
            />
          </DashboardCard>

          <DashboardCard title="Số lượng & trạng thái Lead">
            <StackedBarChart periods={data.periods} segments={LEAD_SEGMENTS} data={data.leadStats} />
          </DashboardCard>

          <DashboardCard title="Số lượng & trạng thái Hợp đồng">
            <StackedBarChart periods={data.periods} segments={ORDER_SEGMENTS} data={data.orderStats} />
          </DashboardCard>

          <DashboardCard title="Số lượng & kết quả chăm sóc khách hàng">
            <StackedBarChart periods={data.periods} segments={CSKH_SEGMENTS} data={data.cskhStats} />
          </DashboardCard>
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  const isAdmin = useAuthStore((s) => s.account?.isAdmin ?? false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["health"],
    queryFn: apiClient.getHealth
  });

  return (
    <div className="space-y-6">
      {isAdmin && <AdminDashboard />}

      {!isAdmin && (
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Chào mừng trở lại 👋</h1>
          <p className="text-sm text-gray-500">Bạn đang đăng nhập vào hệ thống F-Solution CRM/ERP. Sử dụng menu bên trái để điều hướng.</p>
        </div>
      )}

      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-base font-semibold text-gray-800 mb-3">Trạng thái hệ thống</h2>
        {isLoading && (
          <div className="flex items-center gap-2">
            <svg className="animate-spin h-3.5 w-3.5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-sm text-gray-400">Đang kiểm tra backend...</span>
          </div>
        )}
        {isError && (
          <div className="flex items-center gap-2 text-red-600">
            <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
            <span className="text-sm font-medium">Không thể kết nối đến backend</span>
          </div>
        )}
        {data && (
          <div className="flex items-center gap-2">
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="text-sm font-medium text-emerald-700">Backend online</span>
            <span className="text-xs text-gray-400 ml-1">· Status: {data.status}</span>
          </div>
        )}
      </div>
    </div>
  );
}
