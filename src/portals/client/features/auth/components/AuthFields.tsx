/**
 * AuthFields — các ô nhập dùng chung cho form đăng ký
 * -----------------------------------------------------------
 * Dùng bởi RegisterForm (ô mật khẩu có nút hiện/ẩn).
 */

import React from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/shared/utils';

export interface FieldProps {
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

export const Field: React.FC<FieldProps> = ({
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

export interface PasswordFieldProps {
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

export const PasswordField: React.FC<PasswordFieldProps> = ({
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
