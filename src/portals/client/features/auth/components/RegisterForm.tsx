/**
 * RegisterForm — Form đăng ký tài khoản mới (luồng email)
 * -----------------------------------------------------------
 * Tuân thủ DTO Backend (RegisterRequest):
 *   - Họ và tên (fullName) - Bắt buộc
 *   - Email (email) - Bắt buộc
 *   - Số điện thoại (phone) - Tùy chọn, 10-11 chữ số
 *   - Đồng ý điều khoản (agree)
 *
 * KHÔNG còn ô mật khẩu: sau khi đăng ký, hệ thống gửi email chứa link
 * đặt mật khẩu (trang /set-password). Submit thành công → màn hình
 * "Vui lòng kiểm tra email" + nút gửi lại email.
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  UserPlus,
  Sparkles,
  MailCheck,
  AlertCircle,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { useAuthStore } from '@/shared/auth/useAuthStore';
import { resendActivationApi } from '@/shared/auth/authService';
import { cn } from '@/shared/utils';
import { Field } from './AuthFields';

export const RegisterForm: React.FC = () => {
  const { register, isLoading, error, clearError } = useAuthStore();

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    agree: false,
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [emailSent, setEmailSent] = useState<string | null>(null);
  const [resendState, setResendState] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle');
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
      await register({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() ? form.phone.trim() : undefined,
      });
      setResendState('idle');
      setEmailSent(form.email.trim());
    } catch {
      /* store error */
    }
  };

  const handleResend = async () => {
    if (!emailSent) return;
    setResendState('sending');
    setNotice(null);
    const res = await resendActivationApi(emailSent);
    if (res.success) {
      setResendState('sent');
      setNotice(res.message);
    } else {
      setResendState('failed');
      setNotice(res.message);
    }
  };

  /* =============== Màn hình "Đã gửi email kích hoạt" =============== */
  if (emailSent) {
    return (
      <div className="w-full max-w-xl mx-auto bg-white rounded-3xl overflow-hidden shadow-2xl shadow-brand-900/10 border border-slate-200/70">
        <div className="relative px-8 sm:px-12 py-12 text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
            <MailCheck className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="mt-5 text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">
            Vui lòng kiểm tra email
          </h2>
          <p className="mt-2 text-sm text-slate-500 leading-relaxed">
            Chúng tôi đã gửi link kích hoạt tới{' '}
            <span className="font-semibold text-slate-700">{emailSent}</span>.
            Bấm vào link trong email để <strong>đặt mật khẩu</strong> và bắt đầu
            hành trình học tập.
          </p>
          <p className="mt-1.5 text-xs text-slate-400">
            Link hết hạn sau 24 giờ. Kiểm tra cả thư mục Spam nếu chưa thấy.
          </p>

          {notice && (
            <div
              className={cn(
                'mt-5 flex items-start gap-2 p-3 rounded-xl text-sm text-left',
                resendState === 'failed'
                  ? 'bg-rose-50 border border-rose-200 text-rose-700'
                  : 'bg-emerald-50 border border-emerald-200 text-emerald-700',
              )}
            >
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{notice}</span>
            </div>
          )}

          <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleResend}
              disabled={resendState === 'sending'}
              className={cn(
                'inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all',
                'border border-slate-200 text-slate-600 bg-slate-50 hover:bg-slate-100',
                'disabled:opacity-60 disabled:cursor-not-allowed',
              )}
            >
              <RefreshCw className={cn('w-4 h-4', resendState === 'sending' && 'animate-spin')} />
              {resendState === 'sending' ? 'Đang gửi...' : 'Gửi lại email'}
            </button>
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-semibold text-sm text-brand-600 hover:text-brand-700 hover:bg-brand-50 transition-colors"
            >
              Về trang đăng nhập
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* =============== Form đăng ký =============== */
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
            Đăng ký bằng email — chúng tôi sẽ gửi link để bạn đặt mật khẩu và kích hoạt tài khoản trong vòng một phút.
          </p>
        </div>
      </div>

      {/* ====== FORM BODY ====== */}
      <div className="px-8 sm:px-12 py-10">
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

          {/* Info banner: mật khẩu đặt qua email */}
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm">
            <Mail className="w-4 h-4 mt-0.5 shrink-0" />
            <span className="leading-relaxed">
              Bạn sẽ nhận được <strong>email chứa link đặt mật khẩu</strong> sau khi đăng ký.
              Tài khoản chỉ được kích hoạt khi bạn hoàn tất bước này.
            </span>
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
                Đang gửi email đăng ký...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4" />
                Đăng ký & nhận email kích hoạt
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

export default RegisterForm;
