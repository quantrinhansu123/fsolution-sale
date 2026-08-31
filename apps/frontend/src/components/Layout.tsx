import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import {
  Activity,
  Users,
  ShoppingCart,
  Contact,
  ClipboardList,
  Megaphone,
  BarChart3,
  Headset,
  Tag,
  MessageSquare,
  Wallet,
  Landmark,
  Receipt,
  IdCard,
  Gauge,
  Settings,
  ScrollText,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  ChevronRight
} from 'lucide-react';

interface NavItem {
  name: string;
  to: string;
  icon: React.ElementType;
  module: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navigationGroups: NavGroup[] = [
  {
    label: 'Tổng Quan',
    items: [
      { name: 'Dashboard', to: '/', icon: Activity, module: 'dashboard' },
    ]
  },
  {
    label: 'Kinh Doanh',
    items: [
      { name: 'Leads', to: '/leads', icon: Contact, module: 'leads' },
      { name: 'Hợp đồng', to: '/orders', icon: ShoppingCart, module: 'orders' },
      { name: 'Khách hàng', to: '/customers', icon: Users, module: 'customers' },
    ]
  },
  {
    label: 'Marketing',
    items: [
      { name: 'Chiến dịch', to: '/campaigns', icon: Megaphone, module: 'campaigns' },
      { name: 'BC Marketing', to: '/marketing-reports', icon: BarChart3, module: 'marketing-reports' },
      { name: 'BC Kinh doanh', to: '/sale-reports', icon: ClipboardList, module: 'sale-reports' },
    ]
  },
  {
    label: 'CSKH & Sản phẩm',
    items: [
      { name: 'Chăm sóc KH', to: '/cskh-logs', icon: Headset, module: 'cskh-logs' },
      { name: 'Phản hồi', to: '/feedbacks', icon: MessageSquare, module: 'feedbacks' },
      { name: 'Sản phẩm', to: '/products', icon: Tag, module: 'products' },
    ]
  },
  {
    label: 'Tài Chính',
    items: [
      { name: 'Thanh toán', to: '/payments', icon: Wallet, module: 'payments' },
      { name: 'Tài khoản quỹ', to: '/cash-accounts', icon: Landmark, module: 'cash-accounts' },
      { name: 'Giao dịch quỹ', to: '/cash-transactions', icon: Receipt, module: 'cash-transactions' },
    ]
  },
  {
    label: 'Nhân Sự',
    items: [
      { name: 'Nhân viên', to: '/employees', icon: IdCard, module: 'employees' },
      { name: 'KPIs', to: '/kpis', icon: Gauge, module: 'kpis' },
    ]
  },
  {
    label: 'Hệ Thống',
    items: [
      { name: 'Tài khoản', to: '/accounts', icon: ShieldCheck, module: 'accounts' },
      { name: 'Audit Log', to: '/audit-logs', icon: ScrollText, module: 'audit-logs' },
      { name: 'Cấu hình', to: '/system-configs', icon: Settings, module: 'system-config' },
    ]
  },
];

function SidebarNavItem({ item, onClick }: { item: NavItem; onClick?: () => void }) {
  const account = useAuthStore((s) => s.account);
  const isAdmin = account?.isAdmin ?? false;
  const permissions = account?.permissions ?? [];
  const hasAccess = isAdmin || permissions.some((p) => p.module === item.module && p.canView);

  if (!hasAccess) return null;

  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      onClick={onClick}
      className={({ isActive }) =>
        `group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium cursor-pointer select-none transition-all duration-150 ${
          isActive
            ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
            : 'text-slate-500 hover:text-blue-700 hover:bg-blue-50'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <item.icon
            size={16}
            strokeWidth={isActive ? 2.5 : 2}
            className={`shrink-0 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-600'}`}
          />
          <span className="truncate">{item.name}</span>
          {isActive && <ChevronRight size={12} className="ml-auto shrink-0 opacity-60" />}
        </>
      )}
    </NavLink>
  );
}

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const account = useAuthStore((s) => s.account);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const isAdmin = account?.isAdmin ?? false;
  const permissions = account?.permissions ?? [];

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="flex flex-col h-full">
      {/* ── Logo & Brand ── */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-blue-100">
        <img
          src="/logo.png"
          alt="F-Solution logo"
          className="w-7 h-7 object-contain shrink-0 drop-shadow-sm"
        />
        <p className="text-blue-900 text-sm font-bold truncate">F-Solution</p>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {navigationGroups.map((group) => {
          const visibleItems = group.items.filter((item) => {
            if (isAdmin) return true;
            return permissions.some((p) => p.module === item.module && p.canView);
          });
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.label}>
              <p className="px-3 mb-1.5 text-xs font-semibold text-blue-300 uppercase tracking-wider">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <SidebarNavItem key={item.to} item={item} onClick={onClose} />
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      {/* ── User Profile & Logout ── */}
      <div className="px-3 py-4 border-t border-blue-100">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-7 h-7 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center shrink-0">
            <span className="text-blue-700 text-xs font-semibold uppercase">
              {account?.username?.charAt(0) ?? 'U'}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-blue-900 text-xs font-medium truncate">{account?.username}</p>
            <p className="text-blue-400 text-xs">{isAdmin ? 'Admin' : 'Nhân viên'}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-500 hover:text-blue-700 hover:bg-blue-50 cursor-pointer transition-colors"
        >
          <LogOut size={15} strokeWidth={2} />
          <span>Đăng xuất</span>
        </button>
      </div>
    </div>
  );
}

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex w-56 shrink-0 flex-col bg-white border-r border-blue-100 shadow-sm">
        <SidebarContent />
      </aside>

      {/* ── Mobile Sidebar Overlay ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile Sidebar Drawer ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-56 bg-white flex flex-col md:hidden shadow-xl border-r border-blue-100 transition-transform duration-200 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent onClose={() => setMobileOpen(false)} />
      </aside>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* ── Top Header (chỉ mobile — desktop dùng sidebar trái) ── */}
        <header className="md:hidden bg-white border-b border-blue-50 px-4 h-14 flex items-center gap-4 shrink-0 shadow-sm">
          {/* Hamburger */}
          <button
            type="button"
            className="p-1.5 rounded-lg text-gray-500 hover:text-blue-700 hover:bg-blue-50 cursor-pointer"
            onClick={() => setMobileOpen(true)}
            aria-label="Mở menu"
          >
            <Menu size={20} />
          </button>

          {/* Mobile Brand */}
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="F-Solution" className="w-7 h-7 object-contain" />
            <span className="text-sm font-bold text-blue-900">F-Solution</span>
          </div>
        </header>

        {/* ── Page Content ── */}
        <main className="flex-1 overflow-y-auto px-4 md:px-6 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
