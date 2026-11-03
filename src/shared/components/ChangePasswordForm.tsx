/**
 * ChangePasswordForm — đổi mật khẩu (POST /api/v1/auth/change-password)
 * -----------------------------------------------------------
 * Dùng chung cho trang Hồ sơ (học viên / mentor) và menu avatar ở Admin.
 * Quy tắc theo BE (ChangePasswordRequest): mật khẩu mới 8 – 100 ký tự, khác mật khẩu cũ.
 * Đổi xong BE thu hồi mọi refresh token → đăng xuất, yêu cầu đăng nhập lại bằng mật khẩu mới.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Eye, EyeOff, KeyRound } from 'lucide-react';
import { Button } from '@/shared/components/Button';
import { useToast } from '@/shared/components/Toast';
import { changePasswordApi } from '@/shared/auth/authService';
import { useAuthStore } from '@/shared/auth/useAuthStore';
import { cn } from '@/shared/utils/cn';

const MIN_LENGTH = 8;
const MAX_LENGTH = 100;

type FieldKey = 'current' | 'next' | 'confirm';

const LABEL: Record<FieldKey, string> = {
  current: 'Mật khẩu hiện tại',
  next: 'Mật khẩu mới',
  confirm: 'Nhập lại mật khẩu mới',
};

const AUTOCOMPLETE: Record<FieldKey, string> = {
  current: 'current-password',
  next: 'new-password',
  confirm: 'new-password',
};

interface ChangePasswordFormProps {
  /** Có thì hiện nút "Huỷ" (VD đóng modal) */
  onCancel?: () => void;
}

export const ChangePasswordForm: React.FC<ChangePasswordFormProps> = ({ onCancel }) => {
  const toast = useToast();
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);

  const [form, setForm] = useState<Record<FieldKey, string>>({ current: '', next: '', confirm: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState(false);
  const [isSubmitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const errors: Record<FieldKey, string> = {
    current: !form.current ? 'Nhập mật khẩu hiện tại' : '',
    next:
      form.next.length < MIN_LENGTH || form.next.length > MAX_LENGTH
        ? `Mật khẩu mới từ ${MIN_LENGTH} đến ${MAX_LENGTH} ký tự`
        : form.next === form.current
          ? 'Mật khẩu mới phải khác mật khẩu hiện tại'
          : '',
    confirm: form.confirm !== form.next ? 'Mật khẩu nhập lại không khớp' : '',
  };
  const hasError = Object.values(errors).some(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (hasError || isSubmitting) return;
    setSubmitting(true);
    const res = await changePasswordApi(form.current, form.next);
    if (!res.success) {
      setServerError(res.message);
      setSubmitting(false);
      return;
    }
    toast.success('Đổi mật khẩu thành công. Vui lòng đăng nhập lại bằng mật khẩu mới.');
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
      {serverError && (
        <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {serverError}
        </div>
      )}

      {(Object.keys(LABEL) as FieldKey[]).map((key) => {
        const error = touched ? errors[key] : '';
        return (
          <div key={key}>
            <label htmlFor={`cpw-${key}`} className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              {LABEL[key]} <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                id={`cpw-${key}`}
                type={showPassword ? 'text' : 'password'}
                value={form[key]}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, [key]: e.target.value }));
                  setServerError('');
                }}
                autoComplete={AUTOCOMPLETE[key]}
                disabled={isSubmitting}
                className={cn(
                  'w-full h-10 pl-3 pr-10 rounded-xl border text-sm outline-none transition-colors bg-white disabled:bg-slate-50',
                  error ? 'border-rose-300 focus:border-rose-400' : 'border-slate-200 focus:border-[#0052CC]',
                )}
              />
              {key === 'current' && (
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              )}
            </div>
            {error && <p className="mt-1 text-[11px] text-rose-500">{error}</p>}
          </div>
        );
      })}

      <p className="text-[11px] text-slate-500">
        Sau khi đổi, bạn sẽ được đăng xuất khỏi mọi thiết bị và cần đăng nhập lại bằng mật khẩu mới.
      </p>

      <div className="flex justify-end gap-2 pt-1">
        {onCancel && (
          <Button type="button" variant="secondary" size="sm" onClick={onCancel} disabled={isSubmitting}>
            Huỷ
          </Button>
        )}
        <Button type="submit" variant="primary" size="sm" leftIcon={KeyRound} isLoading={isSubmitting}>
          Đổi mật khẩu
        </Button>
      </div>
    </form>
  );
};

export default ChangePasswordForm;
