/**
 * RegisterForm — Form đăng ký tài khoản mới
 * -----------------------------------------------------------
 * Tuân thủ DTO Backend (RegisterRequest):
 *   - Họ và tên (fullName) - Bắt buộc
 *   - Email (email) - Bắt buộc
 *   - Số điện thoại (phone) - Tùy chọn, 10-11 chữ số
 *   - Mật khẩu (password) - Bắt buộc, tối thiểu 6 ký tự
 *   - Xác nhận mật khẩu (confirmPassword) - Kiểm tra khớp mật khẩu
 *   - Đồng ý điều khoản (agree)
 *
 * Đăng ký thành công → tự động đăng nhập → chuyển hướng.
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { useAuthStore } from '@/shared/auth/useAuthStore';
import type { UserRole } from '@/shared/types';
import { cn } from '@/shared/utils';

interface RegisterFormProps {
  onSuccessRedirect?: (role: UserRole) => string;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onSuccessRedirect = () => '/my-learning',
}) => {
  const navigate = useNavigate();
  const { register, isLoading, error, clearError } = useAuthStore();

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agree: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<string | null>(null);

  const set = <K extends keyof typeof form>(key: K, val: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!form.fullName.trim()) next.fullName = 'Vui lòng nhập họ tên';
    else if (form.fullName.trim().length < 2)
      next.fullName = 'Họ tên quá ngắn';

    if (!form.email.trim()) next.email = 'Vui lòng nhập email';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      next.email = 'Email không đúng định dạng';

    if (form.phone.trim() && !/^[0-9]{10,11}$/.test(form.phone.trim())) {
      next.phone = 'Số điện thoại phải từ 10 đến 11 chữ số';
    }

    if (!form.password) next.password = 'Vui lòng nhập mật khẩu';
    else if (form.password.length < 6)
      next.password = 'Mật khẩu tối thiểu 6 ký tự';

    if (!form.confirmPassword) next.confirmPassword = 'Vui lòng xác nhận mật khẩu';
    else if (form.confirmPassword !== form.password)
      next.confirmPassword = 'Mật khẩu xác nhận không khớp';

    if (!form.agree) next.agree = 'Bạn cần đồng ý điều khoản để tiếp tục';

    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice(null);
    clearError();
    if (!validate()) return;

    try {
      const user = await register({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() ? form.phone.trim() : undefined,
        password: form.password,
        confirmPassword: form.confirmPassword,
      });
      setNotice(`Chào mừng ${user.fullName} đến với EnglishHub!`);
      setTimeout(() => {
        navigate(onSuccessRedirect(user.role), { replace: true });
      }, 500);
    } catch {
      /* store error */
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-3xl overflow-hidden shadow-2xl shadow-brand-900/10 border border-slate-200/70">
      {/* ====== HEADER ====== */}
      <div className="relative px-8 sm:px-12 pt-10 pb-7 bg-gradient-to-br from-brand-600 via-indigo-600 to-indigo-800 text-white overflow-hidden">
        <div className="absolute -top-24 -right-16 w-72 h-72 bg-amber-400/25 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-10 w-64 h-64 bg-brand-300/25 rounded-full blur-3xl" />

        <div className="relative z-10 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center border border-white/20">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <span className="font-extrabold tracking-tight">
              English<span className="text-amber-300">Hub</span>
            </span>
          </Link>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] font-semibold text-amber-200">
            <UserPlus className="w-3.5 h-3.5" /> Tạo tài khoản
          </span>
        </div>

        <div className="relative z-10 mt-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Bắt đầu hành trình mới
          </h1>
          <p className="mt-1.5 text-white/75 text-sm max-w-xl">
            Tạo tài khoản để tham gia các khóa học, luyện thi và trải nghiệm nền tảng học tập tại EnglishHub.
          </p>
        </div>
      </div>

      {/* ====== FORM BODY ====== */}
      <div className="px-8 sm:px-12 py-10">
        {/* Notices */}
        {notice && (
          <div className="mb-5 flex items-start gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{notice}</span>
          </div>
        )}
        {error && (
          <div className="mb-5 flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {/* Row 1: fullName + email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field
              id="fullName"
              label="Họ và tên *"
              icon={User}
              value={form.fullName}
              onChange={(v) => {
                set('fullName', v);
                if (fieldErrors.fullName)
                  setFieldErrors((p) => ({ ...p, fullName: '' }));
              }}
              placeholder="Nguyễn Văn A"
              error={fieldErrors.fullName}
              autoComplete="name"
            />
            <Field
              id="email"
              label="Email *"
              icon={Mail}
              type="email"
              value={form.email}
              onChange={(v) => {
                set('email', v);
                if (fieldErrors.email)
                  setFieldErrors((p) => ({ ...p, email: '' }));
              }}
              placeholder="you@englishhub.vn"
              error={fieldErrors.email}
              autoComplete="email"
            />
          </div>

          {/* Row 2: phone */}
          <Field
            id="phone"
            label="Số điện thoại"
            icon={Phone}
            type="tel"
            value={form.phone}
            onChange={(v) => {
              set('phone', v);
              if (fieldErrors.phone)
                setFieldErrors((p) => ({ ...p, phone: '' }));
            }}
            placeholder="0912345678 (tùy chọn)"
            error={fieldErrors.phone}
            autoComplete="tel"
          />

          {/* Row 3: password + confirm */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <PasswordField
              id="password"
              label="Mật khẩu *"
              value={form.password}
              onChange={(v) => {
                set('password', v);
                if (fieldErrors.password)
                  setFieldErrors((p) => ({ ...p, password: '' }));
              }}
              placeholder="Tối thiểu 6 ký tự"
              error={fieldErrors.password}
              show={showPassword}
              onToggle={() => setShowPassword((s) => !s)}
              autoComplete="new-password"
            />
            <PasswordField
              id="confirmPassword"
              label="Xác nhận mật khẩu *"
              value={form.confirmPassword}
              onChange={(v) => {
                set('confirmPassword', v);
                if (fieldErrors.confirmPassword)
                  setFieldErrors((p) => ({ ...p, confirmPassword: '' }));
              }}
              placeholder="Nhập lại mật khẩu"
              error={fieldErrors.confirmPassword}
              show={showConfirm}
              onToggle={() => setShowConfirm((s) => !s)}
              autoComplete="new-password"
            />
          </div>

          {/* Agree */}
          <label className="flex items-start gap-2.5 cursor-pointer select-none text-sm pt-1">
            <input
              type="checkbox"
              checked={form.agree}
              onChange={(e) => {
                set('agree', e.target.checked);
                if (fieldErrors.agree)
                  setFieldErrors((p) => ({ ...p, agree: '' }));
              }}
              className="mt-0.5 w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-2 focus:ring-brand-500/30 cursor-pointer"
            />
            <span className="text-slate-600 leading-relaxed">
              Tôi đã đọc và đồng ý với{' '}
              <span className="font-semibold text-brand-600 hover:underline">
                Điều khoản dịch vụ
              </span>{' '}
              &{' '}
              <span className="font-semibold text-brand-600 hover:underline">
                Chính sách bảo mật
              </span>{' '}
              của EnglishHub.
            </span>
          </label>
          {fieldErrors.agree && (
            <p className="text-xs text-rose-600 font-medium -mt-3">
              {fieldErrors.agree}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className={cn(
              'w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-semibold text-white shadow-lg transition-all mt-2',
              'bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700',
              'shadow-brand-600/25 hover:shadow-xl hover:shadow-brand-600/30',
              'disabled:opacity-60 disabled:cursor-not-allowed',
            )}
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Đang tạo tài khoản...
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                Tạo tài khoản
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <p className="text-center text-sm text-slate-500">
            Đã có tài khoản?{' '}
            <Link
              to="/login"
              className="font-bold text-brand-600 hover:text-brand-700 hover:underline"
            >
              Đăng nhập
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

/* ============== Sub-components ============== */

interface FieldProps {
  id: string;
  label: string;
  icon: React.ElementType;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  error?: string;
  autoComplete?: string;
  className?: string;
}

const Field: React.FC<FieldProps> = ({
  id,
  label,
  icon: Icon,
  value,
  onChange,
  placeholder,
  type = 'text',
  error,
  autoComplete,
  className,
}) => (
  <div className={className}>
    <label
      htmlFor={id}
      className="block text-sm font-semibold text-slate-700 mb-1.5"
    >
      {label}
    </label>
    <div className="relative">
      <Icon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={cn(
          'w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl border text-sm text-slate-800 placeholder:text-slate-400 transition-all',
          'focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/10',
          error
            ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/10'
            : 'border-slate-200 focus:border-brand-500',
        )}
      />
    </div>
    {error && (
      <p className="mt-1.5 text-xs text-rose-600 font-medium">{error}</p>
    )}
  </div>
);

interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  show: boolean;
  onToggle: () => void;
  autoComplete?: string;
}

const PasswordField: React.FC<PasswordFieldProps> = ({
  id,
  label,
  value,
  onChange,
  placeholder,
  error,
  show,
  onToggle,
  autoComplete,
}) => (
  <div>
    <label
      htmlFor={id}
      className="block text-sm font-semibold text-slate-700 mb-1.5"
    >
      {label}
    </label>
    <div className="relative">
      <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      <input
        id={id}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={cn(
          'w-full pl-10 pr-12 py-3 bg-slate-50 rounded-xl border text-sm text-slate-800 placeholder:text-slate-400 transition-all',
          'focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/10',
          error
            ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/10'
            : 'border-slate-200 focus:border-brand-500',
        )}
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
        aria-label={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
        tabIndex={-1}
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
    {error && (
      <p className="mt-1.5 text-xs text-rose-600 font-medium">{error}</p>
    )}
  </div>
);

export default RegisterForm;
