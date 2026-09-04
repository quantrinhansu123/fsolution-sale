import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { ShieldCheck, Zap, BarChart3, Users } from "lucide-react";

const FEATURES = [
  { icon: BarChart3, text: "Dashboard & báo cáo thời gian thực" },
  { icon: Users, text: "Quản lý khách hàng & hợp đồng" },
  { icon: Zap, text: "Tự động hóa quy trình kinh doanh" },
  { icon: ShieldCheck, text: "Bảo mật phân quyền theo vai trò" },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(username, password);
      navigate("/", { replace: true });
    } catch {
      setError("Sai tài khoản hoặc mật khẩu. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Left Panel — Brand (ẩn trên mobile) ── */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-800 to-blue-950 flex-col justify-between p-12">
        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        {/* Decorative blue glow */}
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top: Logo */}
        <div className="relative flex items-center gap-3">
          <img src={`${import.meta.env.BASE_URL}logo.png`} alt="F-Solution" className="w-12 h-12 object-contain drop-shadow-lg" />
          <div>
            <p className="text-white font-bold text-lg leading-tight">F-Solution</p>
            <p className="text-blue-200 text-xs">Software Company</p>
          </div>
        </div>

        {/* Middle: Headline */}
        <div className="relative space-y-6">
          <div>
            <h1 className="text-4xl font-bold text-white leading-tight tracking-tight">
              Quản lý doanh nghiệp<br />
              <span className="text-blue-300">thông minh hơn</span>
            </h1>
            <p className="mt-4 text-blue-100/80 text-base leading-relaxed max-w-sm">
              Nền tảng CRM/ERP tích hợp giúp đội ngũ của bạn làm việc hiệu quả, ra quyết định dựa trên dữ liệu thực.
            </p>
          </div>

          {/* Feature list */}
          <ul className="space-y-3">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <div className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center shrink-0 border border-white/20">
                  <Icon size={14} className="text-blue-200" />
                </div>
                <span className="text-blue-100 text-sm">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom: Footer */}
        <div className="relative">
          <p className="text-blue-300/60 text-xs">© 2026 F-Solution. Phần mềm quản lý doanh nghiệp.</p>
        </div>
      </div>

      {/* ── Right Panel — Login Form ── */}
      <div className="flex-1 flex items-center justify-center bg-slate-50 px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo (chỉ hiện khi ẩn left panel) */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <img src={`${import.meta.env.BASE_URL}logo.png`} alt="F-Solution" className="w-9 h-9 object-contain" />
            <div>
              <p className="text-blue-900 font-bold">F-Solution</p>
              <p className="text-blue-400 text-xs">CRM / ERP Platform</p>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Đăng nhập</h2>
            <p className="mt-1.5 text-sm text-gray-500">Nhập thông tin tài khoản của bạn để tiếp tục.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <label htmlFor="login-username" className="block text-sm font-medium text-gray-700 mb-1.5">
                Tài khoản
              </label>
              <input
                id="login-username"
                name="username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                placeholder="Nhập tài khoản..."
              />
            </div>

            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 mb-1.5">
                Mật khẩu
              </label>
              <input
                id="login-password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                placeholder="••••••••"
              />
            </div>

            {/* Error message */}
            {error && (
              <div className="flex items-start gap-2 px-3.5 py-3 bg-red-50 border border-red-200 rounded-lg">
                <span className="text-red-500 text-sm font-medium mt-0.5">⚠</span>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Submit button */}
            <button
              id="btn-login-submit"
              type="submit"
              disabled={submitting}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Đang đăng nhập...
                </>
              ) : (
                "Đăng nhập"
              )}
            </button>
          </form>

          {/* Footer note */}
          <p className="mt-8 text-center text-xs text-gray-400">
            Liên hệ quản trị viên nếu bạn quên mật khẩu.
          </p>
        </div>
      </div>
    </div>
  );
}
