/**
 * LoginForm — 2-column Gold Flow Auth
 * -----------------------------------------------------------
 * Cột trái (42%): Dark Navy #0F172A — logo AI + feature preview card
 * Cột phải (58%): Canvas sáng, card form trắng max-w-480px
 *
 * Flow: Sau khi đăng nhập thật → redirect theo role.
 *       Student Demo Login → redirect thẳng /courses/ielts-intensive-mastery
 *       Mentor/Admin Demo Login → chỉ gán role + redirect trang chủ.
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  Sparkles,
  GraduationCap,
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

const DEMO_COURSE_PATH = '/courses/ielts-intensive-mastery';

const QUICK_LOGIN_OPTIONS: {
  role: UserRole;
  label: string;
  icon: React.ElementType;
  tone: string;
}[] = [
  {
    role: 'STUDENT',
    label: 'Student Demo',
    icon: GraduationCap,
    tone:
      'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100 hover:border-sky-300',
  },
];

const redirectAfterLogin = (role: UserRole): string => {
  if (role === 'STUDENT') return DEMO_COURSE_PATH;
  if (role === 'ADMIN') return '/admin';
  if (role === 'MENTOR') return '/schedule';
  return '/';
};

export const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const { login, mockLogin, isLoading, error, clearError } = useAuthStore();

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
    if (!email.trim()) next.email = 'Vui lòng nhập email';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      next.email = 'Email không đúng định dạng';
    if (!password) next.password = 'Vui lòng nhập mật khẩu';
    else if (password.length < 6) next.password = 'Mật khẩu tối thiểu 6 ký tự';
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
      setTimeout(
        () => navigate(redirectAfterLogin(user.role), { replace: true }),
        400,
      );
    } catch {
      /* error đã được set trong store */
    }
  };

  const handleQuickLogin = async (role: UserRole) => {
    setNotice(null);
    clearError();
    try {
      const user = await mockLogin(role);
      setNotice(`Đăng nhập nhanh với vai trò ${role}`);
      setTimeout(
        () => navigate(redirectAfterLogin(user.role), { replace: true }),
        300,
      );
    } catch {
      /* error đã được set trong store */
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
              Diagnostic Exam Workspace
            </p>
          </div>
        </div>

        {/* Hero copy */}
        <div className="relative z-10 space-y-5">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-ai/10 border border-ai/30 text-xs font-bold text-ai">
            <Sparkles className="w-3.5 h-3.5" />
            AI-Powered · Chuẩn Cambridge / IDP / ETS
          </span>
          <h1 className="text-3xl xl:text-4xl font-extrabold leading-tight tracking-tight">
            Luyện thi IELTS, TOEIC, VSTEP <br />
            với <span className="text-ai">trợ lý AI</span> 24/7.
          </h1>
          <p className="text-slate-300 text-sm leading-relaxed max-w-md">
            Chẩn đoán năng lực đầu vào, lộ trình cá nhân hoá, ngân hàng đề thi
            cập nhật liên tục và lớp học 1-1 với Mentor bản ngữ.
          </p>

          {/* Feature preview card */}
          <div className="rounded-card border border-slate-700/60 bg-slate-800/40 backdrop-blur-sm p-4 space-y-3 mt-4">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
              Tính năng nổi bật
            </p>
            <ul className="space-y-2.5">
              {[
                {
                  icon: Brain,
                  title: 'AI Diagnostic',
                  desc: 'Đánh giá năng lực 15 phút, gợi ý lộ trình',
                },
                {
                  icon: Trophy,
                  title: 'Luyện đề chuẩn hoá',
                  desc: 'IELTS / TOEIC / VSTEP cập nhật hàng tuần',
                },
                {
                  icon: Calendar,
                  title: 'Mentor 1-1 theo lịch',
                  desc: 'Đặt lịch, phòng học ảo tích hợp video call',
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

        {/* Stats */}
        <div className="relative z-10 grid grid-cols-3 gap-4 pt-5 border-t border-slate-800">
          {[
            { k: '12.000+', v: 'Học viên' },
            { k: '350+', v: 'Mentor' },
            { k: '4.9★', v: 'Đánh giá' },
          ].map((s) => (
            <div key={s.v}>
              <p className="text-xl font-extrabold text-ai">{s.k}</p>
              <p className="text-[10px] text-slate-400 mt-0.5 font-medium uppercase tracking-wider">
                {s.v}
              </p>
            </div>
          ))}
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
            PrepMaster
            <span className="ml-1 text-ai text-sm font-extrabold tracking-widest">
              AI
            </span>
          </span>
        </div>

        <div className="flex-1 flex flex-col justify-center max-w-[480px] w-full mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Chào mừng trở lại 👋
          </h2>
          <p className="text-slate-500 text-sm mt-1.5">
            Đăng nhập để tiếp tục hành trình chinh phục chứng chỉ của bạn.
          </p>

          {/* Notice / Error */}
          {notice && (
            <div className="mt-5 flex items-start gap-2 p-3 rounded-input bg-status-success-bg border border-emerald-200 text-emerald-700 text-sm">
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{notice}</span>
            </div>
          )}
          {error && (
            <div className="mt-5 flex items-start gap-2 p-3 rounded-input bg-status-danger-bg border border-red-200 text-status-danger text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-7 space-y-5" noValidate>
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-slate-700 mb-1.5"
              >
                Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email)
                      setFieldErrors((p) => ({ ...p, email: undefined }));
                  }}
                  placeholder="you@prepmaster.ai"
                  className={cn(
                    'w-full h-11 pl-10 pr-4 bg-white rounded-input border text-sm text-slate-800 placeholder:text-slate-400 transition-all',
                    'focus:outline-none focus:ring-4 focus:ring-primary/10',
                    fieldErrors.email
                      ? 'border-red-400 focus:border-red-500 focus:ring-red-500/10'
                      : 'border-slate-200 focus:border-primary',
                  )}
                  autoComplete="email"
                />
              </div>
              {fieldErrors.email && (
                <p className="mt-1.5 text-xs text-red-600 font-medium">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-slate-700 mb-1.5"
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
                    if (fieldErrors.password)
                      setFieldErrors((p) => ({ ...p, password: undefined }));
                  }}
                  placeholder="••••••••"
                  className={cn(
                    'w-full h-11 pl-10 pr-12 bg-white rounded-input border text-sm text-slate-800 placeholder:text-slate-400 transition-all',
                    'focus:outline-none focus:ring-4 focus:ring-primary/10',
                    fieldErrors.password
                      ? 'border-red-400 focus:border-red-500 focus:ring-red-500/10'
                      : 'border-slate-200 focus:border-primary',
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
                <p className="mt-1.5 text-xs text-red-600 font-medium">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            {/* Row: remember + forgot */}
            <div className="flex items-center justify-between text-sm">
              <label className="inline-flex items-center gap-2 cursor-pointer select-none text-slate-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-2 focus:ring-primary/30 cursor-pointer"
                />
                Ghi nhớ đăng nhập
              </label>
              <Link
                to="/forgot-password"
                className="font-semibold text-primary hover:text-primary-hover hover:underline"
              >
                Quên mật khẩu?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                'w-full h-12 inline-flex items-center justify-center gap-2 px-5 rounded-input font-bold text-white shadow-md transition-all',
                'bg-primary hover:bg-primary-hover shadow-primary/25 hover:shadow-lg hover:shadow-primary/30',
                'disabled:opacity-60 disabled:cursor-not-allowed',
              )}
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Đang đăng nhập...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6 flex items-center gap-3">
            <span className="flex-1 h-px bg-slate-200" />
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
              Quick Demo Login · Báo cáo thầy
            </span>
            <span className="flex-1 h-px bg-slate-200" />
          </div>

          {/* ====== QUICK DEMO LOGIN 3 NÚT ====== */}
          <div className="mt-4 grid grid-cols-1 gap-2.5">
            {QUICK_LOGIN_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.role}
                  type="button"
                  onClick={() => handleQuickLogin(opt.role)}
                  disabled={isLoading}
                  className={cn(
                    'flex flex-row items-center justify-center gap-2 px-3 py-2.5 rounded-input border text-xs font-bold transition-all',
                    'hover:-translate-y-0.5 hover:shadow-sm',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    opt.tone,
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {opt.label}
                </button>
              );
            })}
          </div>
          <p className="mt-2.5 text-[11px] text-slate-400 text-center leading-relaxed">
            Bấm <b className="text-slate-600">Student Demo</b> để vào thẳng trang
            chi tiết khóa học & trải nghiệm luồng Gold Flow.
          </p>

          {/* Sign up link */}
          <p className="mt-6 text-center text-sm text-slate-500">
            Chưa có tài khoản?{' '}
            <Link
              to="/register"
              className="font-bold text-primary hover:text-primary-hover hover:underline"
            >
              Đăng ký ngay
            </Link>
          </p>
        </div>

        <p className="text-center text-[10px] text-slate-400 mt-6 font-medium">
          © 2026 PrepMaster AI · Hệ thống luyện thi chuẩn hoá
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
