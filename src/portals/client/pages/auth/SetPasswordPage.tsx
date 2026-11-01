/**
 * SetPasswordPage — Trang đặt mật khẩu qua link kích hoạt email
 * -----------------------------------------------------------
 * Luồng: người dùng bấm link /set-password?token=... trong email
 *   1. Verify token (BE trả email + họ tên nếu hợp lệ)
 *   2. Nhập mật khẩu mới + xác nhận (min 6 ký tự)
 *   3. Activate → BE kích hoạt tài khoản và trả phiên JWT → tự đăng nhập
 *      và chuyển về /my-learning
 * Token sai/hết hạn → màn hình báo lỗi + hướng dẫn đăng ký lại.
 */

import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  KeyRound,
  Loader2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useAuthStore } from '@/portals/client/features/auth';
import { verifyActivationTokenApi } from '@/shared/auth';
import type { ActivationInfo } from '@/shared/types';
import { cn } from '@/shared/utils';
import { PasswordField } from '@/portals/client/features/auth/components/AuthFields';

type Phase = 'verifying' | 'form' | 'invalid' | 'done';

const SetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const { activate, isLoading, error, clearError } = useAuthStore();

  const [phase, setPhase] = useState<Phase>('verifying');
  const [info, setInfo] = useState<ActivationInfo | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!token) {
        if (!cancelled) {
          setPhase('invalid');
          setVerifyError('Đường dẫn kích hoạt không chứa token hợp lệ.');
        }
        return;
      }
      const res = await verifyActivationTokenApi(token);
      if (cancelled) return;
      if (res.success && res.data) {
        setInfo(res.data);
        setPhase('form');
      } else {
        setVerifyError(res.message);
        setPhase('invalid');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!password) next.password = 'Vui lòng nhập mật khẩu';
    else if (password.length < 6) next.password = 'Mật khẩu tối thiểu 6 ký tự';

    if (!confirm) next.confirm = 'Vui lòng xác nhận mật khẩu';
    else if (confirm !== password) next.confirm = 'Mật khẩu xác nhận không khớp';

    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (!validate() || !token) return;

    try {
      await activate(token, password);
      setPhase('done');
      setTimeout(() => navigate('/my-learning', { replace: true }), 900);
    } catch {
      /* store error hiển thị qua `error` */
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 flex flex-col">
      {/* Top bar */}
      <header className="px-6 sm:px-10 py-5 flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2.5 text-slate-700 hover:text-slate-900"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-brand-600/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-extrabold tracking-tight">
            English<span className="text-brand-600">Hub</span>
          </span>
        </Link>
        <Link
          to="/login"
          className="text-sm font-semibold text-brand-600 hover:text-brand-700 hover:underline"
        >
          Đăng nhập
        </Link>
      </header>

      <main className="flex-1 px-4 sm:px-6 py-6 sm:py-10 flex items-start sm:items-center justify-center">
        <div className="w-full max-w-md mx-auto bg-white rounded-3xl overflow-hidden shadow-2xl shadow-brand-900/10 border border-slate-200/70">
          {/* Header */}
          <div className="px-8 pt-9 pb-6 bg-gradient-to-br from-brand-600 via-indigo-600 to-indigo-800 text-white">
            <div className="w-11 h-11 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center">
              <KeyRound className="w-5 h-5 text-amber-300" />
            </div>
            <h1 className="mt-4 text-xl sm:text-2xl font-extrabold tracking-tight">
              {phase === 'done'
                ? 'Kích hoạt thành công!'
                : phase === 'invalid'
                  ? 'Link không hợp lệ'
                  : 'Đặt mật khẩu của bạn'}
            </h1>
            <p className="mt-1.5 text-white/75 text-sm">
              {phase === 'form' && info
                ? `Xin chào ${info.fullName} — hoàn tất bước cuối để bắt đầu học tại EnglishHub.`
                : phase === 'invalid'
                  ? 'Vui lòng kiểm tra lại đường dẫn trong email.'
                  : 'Bảo mật tài khoản của bạn với mật khẩu mới.'}
            </p>
          </div>

          <div className="px-8 py-8">
            {/* ===== Verifying ===== */}
            {phase === 'verifying' && (
              <div className="flex flex-col items-center gap-3 py-6 text-slate-500">
                <Loader2 className="w-7 h-7 animate-spin text-brand-600" />
                <p className="text-sm">Đang kiểm tra link kích hoạt...</p>
              </div>
            )}

            {/* ===== Invalid ===== */}
            {phase === 'invalid' && (
              <div className="space-y-5">
                <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>
                    {verifyError ??
                      'Đường link kích hoạt không hợp lệ hoặc đã hết hạn (link chỉ dùng được trong 24 giờ và một lần).'}
                  </span>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Bạn có thể quay lại đăng ký để nhận email kích hoạt mới — chỉ cần
                  nhập lại email của bạn, hệ thống sẽ tự gửi link khác cho bạn.
                </p>
                <Link
                  to="/register"
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 shadow-lg shadow-brand-600/25"
                >
                  Quay lại trang đăng ký
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}

            {/* ===== Form ===== */}
            {phase === 'form' && (
              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                {error && (
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {info && (
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-600">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      Email đang kích hoạt:{' '}
                      <strong className="text-slate-800">{info.email}</strong>
                    </span>
                  </div>
                )}

                <PasswordField
                  id="password"
                  label="Mật khẩu mới *"
                  value={password}
                  onChange={(v) => {
                    setPassword(v);
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
                  id="confirm"
                  label="Xác nhận mật khẩu *"
                  value={confirm}
                  onChange={(v) => {
                    setConfirm(v);
                    if (fieldErrors.confirm)
                      setFieldErrors((p) => ({ ...p, confirm: '' }));
                  }}
                  placeholder="Nhập lại mật khẩu"
                  error={fieldErrors.confirm}
                  show={showConfirm}
                  onToggle={() => setShowConfirm((s) => !s)}
                  autoComplete="new-password"
                />

                <button
                  type="submit"
                  disabled={isLoading}
                  className={cn(
                    'w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-semibold text-white shadow-lg transition-all',
                    'bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700',
                    'shadow-brand-600/25 hover:shadow-xl hover:shadow-brand-600/30',
                    'disabled:opacity-60 disabled:cursor-not-allowed',
                  )}
                >
                  {isLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Đang kích hoạt...
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      Kích hoạt & Đăng nhập
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* ===== Done ===== */}
            {phase === 'done' && (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                <p className="text-sm text-slate-600">
                  Chào mừng <strong>{info?.fullName}</strong>! Đang đưa bạn vào
                  hệ thống...
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="py-5 px-6 text-center text-xs text-slate-400 border-t border-slate-200/70 bg-white/40">
        © 2026 English Center Platform. Hệ thống đào tạo & Khảo thí chuẩn hoá.
      </footer>
    </div>
  );
};

export default SetPasswordPage;
