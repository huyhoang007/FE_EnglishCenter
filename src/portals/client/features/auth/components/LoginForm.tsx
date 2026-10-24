/**
 * LoginForm — Real Authentication Form (Clean & Direct)
 * -----------------------------------------------------------
 * Đăng nhập thực tế thông qua Backend API (không dùng mock data).
 * Hỗ trợ các vai trò: ADMIN, MENTOR, STUDENT, USER.
 */

import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  Sparkles,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  BookOpenCheck,
  Brain,
  Trophy,
  Calendar,
} from 'lucide-react';
import { useAuthStore } from '@/shared/auth/useAuthStore';
import type { UserRole } from '@/shared/types';
import { cn } from '@/shared/utils';

const redirectAfterLogin = (role: UserRole): string => {
  if (role === 'ADMIN') return '/admin';
  if (role === 'MENTOR') return '/admin/mentors';
  if (role === 'STUDENT') return '/courses';
  return '/courses';
};

export const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [notice, setNotice] = useState<string | null>(null);

  const validate = (): boolean => {
    const next: typeof fieldErrors = {};
    if (!email.trim()) {
      next.email = 'Vui lòng nhập email đăng nhập';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      next.email = 'Email không đúng định dạng';
    }
    if (!password) {
      next.password = 'Vui lòng nhập mật khẩu';
    } else if (password.length < 6) {
      next.password = 'Mật khẩu tối thiểu 6 ký tự';
    }
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice(null);
    clearError();
    if (!validate()) return;
    try {
      const user = await login({ email, password, rememberMe });
      setNotice(`Chào mừng ${user.fullName}!`);
      setTimeout(() => {
        const from = (location.state as { from?: string } | null)?.from;
        const returnToCourse = ['USER', 'STUDENT'].includes(user.role) && typeof from === 'string' && /^\/courses\/[^/]+(?:\?.*)?$/.test(from);
        navigate(returnToCourse ? from! : redirectAfterLogin(user.role), { replace: true });
      }, 300);
    } catch {
      /* error message đã được lưu trong store và hiển thị trên UI */
    }
  };

  return (
    <div className="w-full h-screen grid grid-cols-1 lg:grid-cols-[42%_58%] bg-canvas overflow-hidden">
      {/* ===================== CỘT TRÁI (Dark Navy 42%) ===================== */}
      <aside className="relative hidden lg:flex flex-col justify-between p-8 xl:p-12 bg-navy-900 text-white overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute -top-40 -left-20 w-[420px] h-[420px] bg-primary/20 rounded-full blur-[120px]" />
        <div className="absolute -bottom-32 -right-20 w-[400px] h-[400px] bg-ai/25 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(124,58,237,0.18),transparent_60%)]" />

        {/* Brand */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-11 h-11 rounded-input bg-ai-gradient flex items-center justify-center shadow-ai-glow">
            <BookOpenCheck className="w-5 h-5 text-white" strokeWidth={2.4} />
          </div>
          <div className="leading-tight">
            <p className="font-extrabold text-lg tracking-tight">
              PrepMaster
              <span className="ml-1 text-ai text-sm font-extrabold tracking-widest">
                AI
              </span>
            </p>
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400 mt-1">
              English Center Platform
            </p>
          </div>
        </div>

        {/* Hero copy */}
        <div className="relative z-10 space-y-5">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-ai/10 border border-ai/30 text-xs font-bold text-ai">
            <Sparkles className="w-3.5 h-3.5" />
            Chuẩn Cambridge / IDP / ETS · IELTS · TOEIC · VSTEP
          </span>
          <h1 className="text-3xl xl:text-4xl font-extrabold leading-tight tracking-tight">
            Hệ thống đào tạo Tiếng Anh <br />
            chuyên nghiệp & hiện đại.
          </h1>
          <p className="text-slate-300 text-sm leading-relaxed max-w-md">
            Quản trị học viên, đội ngũ giảng viên (Mentors), lộ trình luyện thi chứng chỉ quốc tế và các bài kiểm tra chẩn đoán năng lực.
          </p>

          {/* Feature preview card */}
          <div className="rounded-card border border-slate-700/60 bg-slate-800/40 backdrop-blur-sm p-4 space-y-3 mt-4">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
              Các tính năng hệ thống
            </p>
            <ul className="space-y-2.5">
              {[
                {
                  icon: Brain,
                  title: 'Kiểm tra chẩn đoán năng lực',
                  desc: 'Đánh giá trình độ và xây dựng lộ trình học tập mục tiêu',
                },
                {
                  icon: Trophy,
                  title: 'Ngân hàng đề thi chuẩn hóa',
                  desc: 'Kho đề thi IELTS, TOEIC, VSTEP cập nhật liên tục',
                },
                {
                  icon: Calendar,
                  title: 'Đội ngũ Giảng viên & Mentors',
                  desc: 'Giảng dạy chuyên môn và hỗ trợ học viên 1-kèm-1',
                },
              ].map((f) => {
                const Icon = f.icon;
                return (
                  <li key={f.title} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-md bg-ai/15 border border-ai/30 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-ai" />
                    </div>
                    <div className="leading-tight">
                      <p className="font-bold text-sm text-white">{f.title}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {f.desc}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 pt-5 border-t border-slate-800 text-xs text-slate-400">
          PrepMaster Academy Management System © 2026
        </div>
      </aside>

      {/* ===================== CỘT PHẢI (Canvas 58%) ===================== */}
      <div className="flex flex-col p-6 sm:p-10 lg:p-12 overflow-y-auto bg-canvas">
        {/* Mobile brand */}
        <div className="lg:hidden mb-6 flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-ai-gradient flex items-center justify-center shadow-ai-glow">
            <BookOpenCheck className="w-4 h-4 text-white" />
          </div>
          <span className="font-extrabold tracking-tight text-slate-900">
            PrepMaster <span className="text-[#0052CC]">Academy</span>
          </span>
        </div>

        <div className="flex-1 flex flex-col justify-center max-w-[480px] w-full mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Đăng nhập hệ thống 👋
          </h2>
          <p className="text-slate-500 text-sm mt-1.5">
            Nhập thông tin tài khoản để truy cập vào hệ thống trung tâm.
          </p>

          {/* Notice / Error Feedback */}
          {notice && (
            <div className="mt-5 flex items-start gap-2 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" />
              <span>{notice}</span>
            </div>
          )}
          {error && (
            <div className="mt-5 flex items-start gap-2 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                Email đăng nhập
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) {
                      setFieldErrors((p) => ({ ...p, email: undefined }));
                    }
                  }}
                  placeholder="admin@gmail.com"
                  className={cn(
                    'w-full h-11 pl-10 pr-4 bg-white rounded-xl border text-sm text-slate-800 placeholder:text-slate-400 transition-all',
                    'focus:outline-none focus:ring-4 focus:ring-primary/10',
                    fieldErrors.email
                      ? 'border-red-400 focus:border-red-500'
                      : 'border-slate-200 focus:border-[#0052CC]',
                  )}
                  autoComplete="email"
                />
              </div>
              {fieldErrors.email && (
                <p className="mt-1 text-xs text-rose-600 font-medium">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                Mật khẩu
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) {
                      setFieldErrors((p) => ({ ...p, password: undefined }));
                    }
                  }}
                  placeholder="••••••••"
                  className={cn(
                    'w-full h-11 pl-10 pr-12 bg-white rounded-xl border text-sm text-slate-800 placeholder:text-slate-400 transition-all',
                    'focus:outline-none focus:ring-4 focus:ring-primary/10',
                    fieldErrors.password
                      ? 'border-red-400 focus:border-red-500'
                      : 'border-slate-200 focus:border-[#0052CC]',
                  )}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="mt-1 text-xs text-rose-600 font-medium">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            {/* Row: remember + forgot */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="inline-flex items-center gap-2 cursor-pointer select-none text-slate-600 font-medium">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-[#0052CC] focus:ring-2 focus:ring-[#0052CC]/20 cursor-pointer"
                />
                Ghi nhớ đăng nhập
              </label>
              <Link
                to="/forgot-password"
                className="font-semibold text-[#0052CC] hover:underline"
              >
                Quên mật khẩu?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                'w-full h-11 inline-flex items-center justify-center gap-2 px-5 rounded-xl font-bold text-white shadow-md transition-all mt-2',
                'bg-[#0052CC] hover:bg-[#0040A8]',
                'disabled:opacity-60 disabled:cursor-not-allowed',
              )}
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Đang xác thực tài khoản...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Đăng nhập
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Sign up link */}
          <p className="mt-6 text-center text-xs text-slate-500">
            Chưa có tài khoản?{' '}
            <Link
              to="/register"
              className="font-bold text-[#0052CC] hover:underline"
            >
              Đăng ký tài khoản học viên
            </Link>
          </p>
        </div>

        <p className="text-center text-[10px] text-slate-400 mt-6 font-medium">
          © 2026 PrepMaster English Center · Bản quyền thuộc về trung tâm
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
